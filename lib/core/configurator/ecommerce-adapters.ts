/**
 * E-commerce Platform Adapters
 *
 * Unified interface for integrating with Shopify, WooCommerce, BigCommerce,
 * and custom e-commerce backends.
 */

import type {
  EcommerceCredentials,
  EcommercePlatform,
  Cart,
  CartItem,
  CheckoutData,
  OrderResult,
  Product,
} from './types';

// ============== ADAPTER INTERFACE ==============

export interface EcommerceAdapter {
  platform: EcommercePlatform;
  isConnected(): Promise<boolean>;
  syncProduct(product: Product): Promise<{ success: boolean; externalId?: string; error?: string }>;
  getProduct(externalId: string): Promise<Product | null>;
  createCheckout(data: CheckoutData): Promise<OrderResult>;
  addToCart(item: CartItem): Promise<{ success: boolean; cartId?: string; error?: string }>;
  getInventory(productId: string, variantId?: string): Promise<{ available: boolean; quantity?: number }>;
}

// ============== SHOPIFY ADAPTER ==============

export class ShopifyAdapter implements EcommerceAdapter {
  platform: EcommercePlatform = 'shopify';
  private shopDomain: string;
  private accessToken: string;
  private apiVersion: string;

  constructor(credentials: NonNullable<EcommerceCredentials['shopify']>) {
    this.shopDomain = credentials.shopDomain;
    this.accessToken = credentials.accessToken;
    this.apiVersion = credentials.apiVersion || '2024-01';
  }

  private async graphqlRequest(query: string, variables?: Record<string, any>) {
    const response = await fetch(
      `https://${this.shopDomain}/api/${this.apiVersion}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': this.accessToken,
        },
        body: JSON.stringify({ query, variables }),
      }
    );

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    return response.json();
  }

  async isConnected(): Promise<boolean> {
    try {
      const query = `{ shop { name } }`;
      const result = await this.graphqlRequest(query);
      return !!result.data?.shop?.name;
    } catch {
      return false;
    }
  }

  async syncProduct(product: Product): Promise<{ success: boolean; externalId?: string; error?: string }> {
    // In a real implementation, this would create/update the product in Shopify
    // Using the Admin API (requires different authentication)
    console.log('Syncing product to Shopify:', product.name);
    return {
      success: true,
      externalId: `gid://shopify/Product/${Date.now()}`,
    };
  }

  async getProduct(externalId: string): Promise<Product | null> {
    const query = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          description
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                sku
                price {
                  amount
                  currencyCode
                }
                availableForSale
                quantityAvailable
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          options {
            id
            name
            values
          }
        }
      }
    `;

    try {
      const result = await this.graphqlRequest(query, { id: externalId });
      const shopifyProduct = result.data?.product;

      if (!shopifyProduct) return null;

      // Transform Shopify product to our Product type
      return {
        id: shopifyProduct.id,
        name: shopifyProduct.title,
        description: shopifyProduct.description,
        basePrice: parseFloat(shopifyProduct.priceRange.minVariantPrice.amount),
        currency: shopifyProduct.priceRange.minVariantPrice.currencyCode,
        variantGroups: shopifyProduct.options.map((opt: any) => ({
          id: opt.id,
          name: opt.name,
          type: 'custom' as const,
          required: true,
          multiSelect: false,
          options: opt.values.map((value: string, idx: number) => ({
            id: `${opt.id}-${idx}`,
            name: value,
            value,
            priceModifier: 0,
            priceModifierType: 'fixed' as const,
            available: true,
          })),
        })),
        variants: shopifyProduct.variants.edges.map((edge: any) => ({
          id: edge.node.id,
          sku: edge.node.sku || '',
          name: edge.node.title,
          basePrice: parseFloat(edge.node.price.amount),
          currency: edge.node.price.currencyCode,
          available: edge.node.availableForSale,
          stockQuantity: edge.node.quantityAvailable,
          selectedOptions: edge.node.selectedOptions.reduce(
            (acc: Record<string, string>, opt: any) => {
              acc[opt.name] = opt.value;
              return acc;
            },
            {}
          ),
          images: [],
        })),
        hotspots: [],
      };
    } catch (error) {
      console.error('Error fetching Shopify product:', error);
      return null;
    }
  }

  async createCheckout(data: CheckoutData): Promise<OrderResult> {
    const lineItems = data.cart.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
    }));

    const mutation = `
      mutation checkoutCreate($input: CheckoutCreateInput!) {
        checkoutCreate(input: $input) {
          checkout {
            id
            webUrl
          }
          checkoutUserErrors {
            code
            field
            message
          }
        }
      }
    `;

    try {
      const result = await this.graphqlRequest(mutation, {
        input: {
          lineItems,
          email: data.customer?.email,
          shippingAddress: data.shippingAddress
            ? {
                address1: data.shippingAddress.address1,
                address2: data.shippingAddress.address2,
                city: data.shippingAddress.city,
                province: data.shippingAddress.state,
                zip: data.shippingAddress.postalCode,
                country: data.shippingAddress.country,
              }
            : undefined,
        },
      });

      const checkout = result.data?.checkoutCreate?.checkout;
      const errors = result.data?.checkoutCreate?.checkoutUserErrors;

      if (errors?.length > 0) {
        return {
          success: false,
          error: errors[0].message,
        };
      }

      return {
        success: true,
        orderId: checkout.id,
        checkoutUrl: checkout.webUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Checkout failed',
      };
    }
  }

  async addToCart(item: CartItem): Promise<{ success: boolean; cartId?: string; error?: string }> {
    const mutation = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    try {
      const result = await this.graphqlRequest(mutation, {
        input: {
          lines: [
            {
              merchandiseId: item.variantId,
              quantity: item.quantity,
            },
          ],
        },
      });

      const cart = result.data?.cartCreate?.cart;
      const errors = result.data?.cartCreate?.userErrors;

      if (errors?.length > 0) {
        return { success: false, error: errors[0].message };
      }

      return { success: true, cartId: cart.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add to cart',
      };
    }
  }

  async getInventory(productId: string, variantId?: string): Promise<{ available: boolean; quantity?: number }> {
    const query = `
      query getInventory($id: ID!) {
        product(id: $id) {
          variants(first: 100) {
            edges {
              node {
                id
                availableForSale
                quantityAvailable
              }
            }
          }
        }
      }
    `;

    try {
      const result = await this.graphqlRequest(query, { id: productId });
      const variants = result.data?.product?.variants?.edges;

      if (!variants) {
        return { available: false };
      }

      if (variantId) {
        const variant = variants.find((v: any) => v.node.id === variantId);
        return {
          available: variant?.node.availableForSale || false,
          quantity: variant?.node.quantityAvailable,
        };
      }

      // Return overall availability
      const anyAvailable = variants.some((v: any) => v.node.availableForSale);
      return { available: anyAvailable };
    } catch {
      return { available: false };
    }
  }
}

// ============== WOOCOMMERCE ADAPTER ==============

export class WooCommerceAdapter implements EcommerceAdapter {
  platform: EcommercePlatform = 'woocommerce';
  private siteUrl: string;
  private consumerKey: string;
  private consumerSecret: string;

  constructor(credentials: NonNullable<EcommerceCredentials['woocommerce']>) {
    this.siteUrl = credentials.siteUrl;
    this.consumerKey = credentials.consumerKey;
    this.consumerSecret = credentials.consumerSecret;
  }

  private async apiRequest(endpoint: string, method: string = 'GET', body?: any) {
    const auth = btoa(`${this.consumerKey}:${this.consumerSecret}`);
    const url = `${this.siteUrl}/wp-json/wc/v3/${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.statusText}`);
    }

    return response.json();
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.apiRequest('system_status');
      return true;
    } catch {
      return false;
    }
  }

  async syncProduct(product: Product): Promise<{ success: boolean; externalId?: string; error?: string }> {
    try {
      const wooProduct = {
        name: product.name,
        type: product.variantGroups.length > 0 ? 'variable' : 'simple',
        regular_price: product.basePrice.toString(),
        description: product.description,
        attributes: product.variantGroups.map((group) => ({
          name: group.name,
          visible: true,
          variation: true,
          options: group.options.map((opt) => opt.name),
        })),
      };

      const result = await this.apiRequest('products', 'POST', wooProduct);
      return {
        success: true,
        externalId: result.id.toString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync product',
      };
    }
  }

  async getProduct(externalId: string): Promise<Product | null> {
    try {
      const wooProduct = await this.apiRequest(`products/${externalId}`);

      return {
        id: wooProduct.id.toString(),
        name: wooProduct.name,
        description: wooProduct.description,
        basePrice: parseFloat(wooProduct.price),
        currency: 'USD', // WooCommerce uses store currency
        variantGroups: wooProduct.attributes?.map((attr: any) => ({
          id: attr.id.toString(),
          name: attr.name,
          type: 'custom' as const,
          required: true,
          multiSelect: false,
          options: attr.options.map((opt: string, idx: number) => ({
            id: `${attr.id}-${idx}`,
            name: opt,
            value: opt,
            priceModifier: 0,
            priceModifierType: 'fixed' as const,
            available: true,
          })),
        })) || [],
        variants: wooProduct.variations?.map((v: any) => ({
          id: v.id.toString(),
          sku: v.sku,
          name: v.name,
          basePrice: parseFloat(v.price),
          currency: 'USD',
          available: v.in_stock,
          stockQuantity: v.stock_quantity,
          selectedOptions: {},
          images: v.image ? [v.image.src] : [],
        })) || [],
        hotspots: [],
      };
    } catch {
      return null;
    }
  }

  async createCheckout(data: CheckoutData): Promise<OrderResult> {
    try {
      const order = {
        payment_method: 'cod', // Default to cash on delivery
        payment_method_title: 'Cash on delivery',
        set_paid: false,
        billing: data.billingAddress
          ? {
              first_name: data.customer?.firstName,
              last_name: data.customer?.lastName,
              email: data.customer?.email,
              phone: data.customer?.phone,
              address_1: data.billingAddress.address1,
              address_2: data.billingAddress.address2,
              city: data.billingAddress.city,
              state: data.billingAddress.state,
              postcode: data.billingAddress.postalCode,
              country: data.billingAddress.country,
            }
          : undefined,
        shipping: data.shippingAddress
          ? {
              address_1: data.shippingAddress.address1,
              address_2: data.shippingAddress.address2,
              city: data.shippingAddress.city,
              state: data.shippingAddress.state,
              postcode: data.shippingAddress.postalCode,
              country: data.shippingAddress.country,
            }
          : undefined,
        line_items: data.cart.items.map((item) => ({
          product_id: parseInt(item.productId),
          variation_id: item.variantId ? parseInt(item.variantId) : undefined,
          quantity: item.quantity,
        })),
      };

      const result = await this.apiRequest('orders', 'POST', order);

      return {
        success: true,
        orderId: result.id.toString(),
        orderNumber: result.number,
        checkoutUrl: result.payment_url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Checkout failed',
      };
    }
  }

  async addToCart(item: CartItem): Promise<{ success: boolean; cartId?: string; error?: string }> {
    // WooCommerce uses CoCart or similar plugin for REST cart management
    // For now, return a placeholder
    return {
      success: true,
      cartId: `woo-cart-${Date.now()}`,
    };
  }

  async getInventory(productId: string, variantId?: string): Promise<{ available: boolean; quantity?: number }> {
    try {
      const endpoint = variantId
        ? `products/${productId}/variations/${variantId}`
        : `products/${productId}`;
      const product = await this.apiRequest(endpoint);

      return {
        available: product.in_stock,
        quantity: product.stock_quantity,
      };
    } catch {
      return { available: false };
    }
  }
}

// ============== BIGCOMMERCE ADAPTER ==============

export class BigCommerceAdapter implements EcommerceAdapter {
  platform: EcommercePlatform = 'bigcommerce';
  private storeHash: string;
  private accessToken: string;

  constructor(credentials: NonNullable<EcommerceCredentials['bigcommerce']>) {
    this.storeHash = credentials.storeHash;
    this.accessToken = credentials.accessToken;
  }

  private async apiRequest(endpoint: string, method: string = 'GET', body?: any) {
    const url = `https://api.bigcommerce.com/stores/${this.storeHash}/v3/${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': this.accessToken,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`BigCommerce API error: ${response.statusText}`);
    }

    return response.json();
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.apiRequest('store');
      return true;
    } catch {
      return false;
    }
  }

  async syncProduct(product: Product): Promise<{ success: boolean; externalId?: string; error?: string }> {
    try {
      const bcProduct = {
        name: product.name,
        type: 'physical',
        price: product.basePrice,
        description: product.description,
        variants: product.variants.map((v) => ({
          sku: v.sku,
          price: v.basePrice,
          inventory_level: v.stockQuantity,
        })),
      };

      const result = await this.apiRequest('catalog/products', 'POST', bcProduct);
      return {
        success: true,
        externalId: result.data.id.toString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync product',
      };
    }
  }

  async getProduct(externalId: string): Promise<Product | null> {
    try {
      const result = await this.apiRequest(`catalog/products/${externalId}?include=variants,options`);
      const bcProduct = result.data;

      return {
        id: bcProduct.id.toString(),
        name: bcProduct.name,
        description: bcProduct.description,
        basePrice: bcProduct.price,
        currency: 'USD',
        variantGroups: bcProduct.options?.map((opt: any) => ({
          id: opt.id.toString(),
          name: opt.display_name,
          type: 'custom' as const,
          required: opt.required,
          multiSelect: false,
          options: opt.option_values.map((val: any) => ({
            id: val.id.toString(),
            name: val.label,
            value: val.label,
            priceModifier: 0,
            priceModifierType: 'fixed' as const,
            available: true,
          })),
        })) || [],
        variants: bcProduct.variants?.map((v: any) => ({
          id: v.id.toString(),
          sku: v.sku,
          name: v.sku,
          basePrice: v.price || bcProduct.price,
          currency: 'USD',
          available: v.inventory_level > 0,
          stockQuantity: v.inventory_level,
          selectedOptions: {},
          images: [],
        })) || [],
        hotspots: [],
      };
    } catch {
      return null;
    }
  }

  async createCheckout(data: CheckoutData): Promise<OrderResult> {
    try {
      const checkout = {
        customer_id: 0, // Guest checkout
        line_items: data.cart.items.map((item) => ({
          product_id: parseInt(item.productId),
          variant_id: item.variantId ? parseInt(item.variantId) : undefined,
          quantity: item.quantity,
        })),
        billing_address: data.billingAddress
          ? {
              first_name: data.customer?.firstName,
              last_name: data.customer?.lastName,
              email: data.customer?.email,
              address1: data.billingAddress.address1,
              address2: data.billingAddress.address2,
              city: data.billingAddress.city,
              state_or_province: data.billingAddress.state,
              postal_code: data.billingAddress.postalCode,
              country_code: data.billingAddress.country,
            }
          : undefined,
      };

      const result = await this.apiRequest('checkouts', 'POST', checkout);

      return {
        success: true,
        orderId: result.data.id,
        checkoutUrl: result.data.cart?.redirect_urls?.checkout_url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Checkout failed',
      };
    }
  }

  async addToCart(item: CartItem): Promise<{ success: boolean; cartId?: string; error?: string }> {
    try {
      const result = await this.apiRequest('carts', 'POST', {
        line_items: [
          {
            product_id: parseInt(item.productId),
            variant_id: item.variantId ? parseInt(item.variantId) : undefined,
            quantity: item.quantity,
          },
        ],
      });

      return {
        success: true,
        cartId: result.data.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add to cart',
      };
    }
  }

  async getInventory(productId: string, variantId?: string): Promise<{ available: boolean; quantity?: number }> {
    try {
      const endpoint = variantId
        ? `catalog/products/${productId}/variants/${variantId}`
        : `catalog/products/${productId}`;
      const result = await this.apiRequest(endpoint);
      const data = result.data;

      return {
        available: data.inventory_level > 0,
        quantity: data.inventory_level,
      };
    } catch {
      return { available: false };
    }
  }
}

// ============== CUSTOM ADAPTER ==============

export class CustomEcommerceAdapter implements EcommerceAdapter {
  platform: EcommercePlatform = 'custom';
  private apiEndpoint: string;
  private apiKey?: string;
  private headers: Record<string, string>;

  constructor(credentials: NonNullable<EcommerceCredentials['custom']>) {
    this.apiEndpoint = credentials.apiEndpoint;
    this.apiKey = credentials.apiKey;
    this.headers = credentials.headers || {};
  }

  private async apiRequest(endpoint: string, method: string = 'GET', body?: any) {
    const url = `${this.apiEndpoint}/${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Custom API error: ${response.statusText}`);
    }

    return response.json();
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.apiRequest('health');
      return true;
    } catch {
      return false;
    }
  }

  async syncProduct(product: Product): Promise<{ success: boolean; externalId?: string; error?: string }> {
    try {
      const result = await this.apiRequest('products', 'POST', product);
      return {
        success: true,
        externalId: result.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync product',
      };
    }
  }

  async getProduct(externalId: string): Promise<Product | null> {
    try {
      return await this.apiRequest(`products/${externalId}`);
    } catch {
      return null;
    }
  }

  async createCheckout(data: CheckoutData): Promise<OrderResult> {
    try {
      const result = await this.apiRequest('checkout', 'POST', data);
      return {
        success: true,
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        checkoutUrl: result.checkoutUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Checkout failed',
      };
    }
  }

  async addToCart(item: CartItem): Promise<{ success: boolean; cartId?: string; error?: string }> {
    try {
      const result = await this.apiRequest('cart/add', 'POST', item);
      return {
        success: true,
        cartId: result.cartId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add to cart',
      };
    }
  }

  async getInventory(productId: string, variantId?: string): Promise<{ available: boolean; quantity?: number }> {
    try {
      const endpoint = variantId
        ? `inventory/${productId}/${variantId}`
        : `inventory/${productId}`;
      return await this.apiRequest(endpoint);
    } catch {
      return { available: false };
    }
  }
}

// ============== ADAPTER FACTORY ==============

export function createEcommerceAdapter(credentials: EcommerceCredentials): EcommerceAdapter {
  switch (credentials.platform) {
    case 'shopify':
      if (!credentials.shopify) throw new Error('Shopify credentials required');
      return new ShopifyAdapter(credentials.shopify);

    case 'woocommerce':
      if (!credentials.woocommerce) throw new Error('WooCommerce credentials required');
      return new WooCommerceAdapter(credentials.woocommerce);

    case 'bigcommerce':
      if (!credentials.bigcommerce) throw new Error('BigCommerce credentials required');
      return new BigCommerceAdapter(credentials.bigcommerce);

    case 'custom':
      if (!credentials.custom) throw new Error('Custom API credentials required');
      return new CustomEcommerceAdapter(credentials.custom);

    default:
      throw new Error(`Unsupported e-commerce platform: ${credentials.platform}`);
  }
}

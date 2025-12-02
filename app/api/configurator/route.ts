/**
 * Configurator API
 *
 * REST API for custom configurator logic:
 * - Calculate pricing
 * - Add to cart
 * - Checkout
 * - Sync with e-commerce platforms
 * - Get inventory
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  ConfiguratorAPIRequest,
  ConfiguratorAPIResponse,
  Product,
  Cart,
  CartItem,
  CheckoutData,
  PriceBreakdown,
  EcommerceCredentials,
} from '@/lib/core/configurator/types';
import {
  calculatePrice,
  calculateCartTotals,
  createCartItem,
  getSelectedVariant,
  isVariantAvailable,
  validateDiscountCode,
} from '@/lib/core/configurator/pricing-calculator';
import { createEcommerceAdapter } from '@/lib/core/configurator/ecommerce-adapters';

// Helper to create response
function createResponse<T>(
  data?: T,
  error?: string,
  status: number = 200
): NextResponse<ConfiguratorAPIResponse<T>> {
  return NextResponse.json(
    {
      success: !error,
      data,
      error,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

// ============== HANDLERS ==============

async function handleCalculatePrice(payload: {
  product: Product;
  selectedOptions: Record<string, string>;
  quantity?: number;
  taxRate?: number;
  discountCode?: string;
  pricingRules?: any[];
}): Promise<NextResponse> {
  try {
    const { product, selectedOptions, quantity = 1, taxRate = 0, discountCode, pricingRules = [] } = payload;

    // Validate discount code if provided
    let discountValue: number | undefined;
    let discountType: 'fixed' | 'percentage' | undefined;

    if (discountCode) {
      // In production, fetch discount codes from database
      const mockDiscountCodes = [
        { code: 'SAVE10', type: 'percentage' as const, value: 10 },
        { code: 'FLAT20', type: 'fixed' as const, value: 20 },
        { code: 'WELCOME', type: 'percentage' as const, value: 15, minPurchase: 50 },
      ];

      const validation = validateDiscountCode(
        discountCode,
        mockDiscountCodes,
        product.basePrice * quantity
      );

      if (!validation.valid) {
        return createResponse(undefined, validation.error, 400);
      }

      discountValue = validation.value;
      discountType = validation.type;
    }

    const priceBreakdown = calculatePrice(
      product,
      selectedOptions,
      quantity,
      pricingRules,
      taxRate,
      discountCode,
      discountValue,
      discountType
    );

    // Check availability
    const available = isVariantAvailable(product, selectedOptions);
    const { variant } = getSelectedVariant(product, selectedOptions);

    return createResponse({
      priceBreakdown,
      available,
      variant,
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    return createResponse(undefined, 'Failed to calculate price', 500);
  }
}

async function handleAddToCart(payload: {
  product: Product;
  selectedOptions: Record<string, string>;
  quantity?: number;
  currentCart?: Cart;
}): Promise<NextResponse> {
  try {
    const { product, selectedOptions, quantity = 1, currentCart } = payload;

    // Validate availability
    if (!isVariantAvailable(product, selectedOptions)) {
      return createResponse(undefined, 'Selected variant is not available', 400);
    }

    // Create cart item
    const item = createCartItem(product, selectedOptions, quantity);
    if (!item) {
      return createResponse(undefined, 'Failed to create cart item', 400);
    }

    // Update cart
    const items = currentCart?.items ? [...currentCart.items, item] : [item];
    const cart = calculateCartTotals(
      {
        items,
        taxAmount: 0,
        shippingCost: currentCart?.shippingCost || 0,
        discountAmount: currentCart?.discountAmount || 0,
        currency: product.currency,
        discountCode: currentCart?.discountCode,
      },
      0 // Tax rate applied at checkout
    );

    return createResponse({ cart, addedItem: item });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return createResponse(undefined, 'Failed to add to cart', 500);
  }
}

async function handleCheckout(payload: {
  checkoutData: CheckoutData;
  ecommerceCredentials?: EcommerceCredentials;
}): Promise<NextResponse> {
  try {
    const { checkoutData, ecommerceCredentials } = payload;

    if (!checkoutData.cart.items.length) {
      return createResponse(undefined, 'Cart is empty', 400);
    }

    // If e-commerce credentials provided, use adapter
    if (ecommerceCredentials) {
      const adapter = createEcommerceAdapter(ecommerceCredentials);
      const result = await adapter.createCheckout(checkoutData);
      return createResponse(result);
    }

    // Otherwise, create a local order (for custom backends)
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // In production, save order to database
    console.log('Creating local order:', orderId, checkoutData);

    return createResponse({
      success: true,
      orderId,
      orderNumber: orderId,
      // Could return a local checkout URL if you have one
    });
  } catch (error) {
    console.error('Error during checkout:', error);
    return createResponse(undefined, 'Checkout failed', 500);
  }
}

async function handleSyncProduct(payload: {
  product: Product;
  ecommerceCredentials: EcommerceCredentials;
}): Promise<NextResponse> {
  try {
    const { product, ecommerceCredentials } = payload;

    const adapter = createEcommerceAdapter(ecommerceCredentials);
    const isConnected = await adapter.isConnected();

    if (!isConnected) {
      return createResponse(undefined, 'Failed to connect to e-commerce platform', 400);
    }

    const result = await adapter.syncProduct(product);
    return createResponse(result);
  } catch (error) {
    console.error('Error syncing product:', error);
    return createResponse(undefined, 'Failed to sync product', 500);
  }
}

async function handleGetInventory(payload: {
  productId: string;
  variantId?: string;
  ecommerceCredentials: EcommerceCredentials;
}): Promise<NextResponse> {
  try {
    const { productId, variantId, ecommerceCredentials } = payload;

    const adapter = createEcommerceAdapter(ecommerceCredentials);
    const inventory = await adapter.getInventory(productId, variantId);

    return createResponse(inventory);
  } catch (error) {
    console.error('Error getting inventory:', error);
    return createResponse(undefined, 'Failed to get inventory', 500);
  }
}

// ============== MAIN HANDLER ==============

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ConfiguratorAPIRequest;
    const { action, payload } = body;

    switch (action) {
      case 'calculate_price':
        return handleCalculatePrice(payload);

      case 'add_to_cart':
        return handleAddToCart(payload);

      case 'checkout':
        return handleCheckout(payload);

      case 'sync_product':
        return handleSyncProduct(payload);

      case 'get_inventory':
        return handleGetInventory(payload);

      default:
        return createResponse(undefined, `Unknown action: ${action}`, 400);
    }
  } catch (error) {
    console.error('Configurator API error:', error);
    return createResponse(undefined, 'Internal server error', 500);
  }
}

// ============== GET HANDLER (for health check) ==============

export async function GET() {
  return createResponse({
    status: 'healthy',
    version: '1.0.0',
    endpoints: [
      'POST /api/configurator - Main API endpoint',
      'Actions: calculate_price, add_to_cart, checkout, sync_product, get_inventory',
    ],
  });
}

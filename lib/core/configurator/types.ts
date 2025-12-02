/**
 * Configurator Types
 *
 * Type definitions for the product configurator system including:
 * - Hotspots with annotations
 * - Product variants with pricing
 * - E-commerce integration
 */

// ============== HOTSPOTS ==============

export interface HotspotPosition {
  x: number;
  y: number;
  z: number;
}

export interface HotspotStyle {
  color?: string;
  size?: number;
  pulseAnimation?: boolean;
  icon?: 'info' | 'plus' | 'cart' | 'zoom' | 'custom';
  customIcon?: string;
}

export interface HotspotContent {
  title: string;
  description?: string;
  mediaUrl?: string; // Image or video URL
  mediaType?: 'image' | 'video';
  ctaText?: string;
  ctaUrl?: string;
  variantId?: string; // Link to a product variant
}

export interface Hotspot {
  id: string;
  objectId: string; // ID of the 3D object this hotspot is attached to
  position: HotspotPosition; // Position relative to object or world
  positionType: 'local' | 'world'; // Local to object or world coordinates
  normalDirection?: HotspotPosition; // Direction the tooltip should face
  content: HotspotContent;
  style: HotspotStyle;
  visible: boolean;
  triggerOnHover: boolean; // Show tooltip on hover vs click
}

// ============== PRODUCT VARIANTS ==============

export interface VariantOption {
  id: string;
  name: string;
  value: string;
  priceModifier: number; // Can be positive or negative
  priceModifierType: 'fixed' | 'percentage';
  thumbnailUrl?: string;
  materialPresetId?: string; // Link to material preset for auto-apply
  available: boolean;
  stockQuantity?: number;
}

export interface VariantGroup {
  id: string;
  name: string; // e.g., "Color", "Size", "Material", "Finish"
  type: 'color' | 'size' | 'material' | 'custom';
  required: boolean;
  multiSelect: boolean; // Allow multiple selections (e.g., add-ons)
  options: VariantOption[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  basePrice: number;
  currency: string;
  compareAtPrice?: number; // Original price for sale display
  costPrice?: number; // For margin calculation
  weight?: number;
  weightUnit?: 'kg' | 'lb' | 'g' | 'oz';
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in' | 'm';
  };
  images: string[];
  available: boolean;
  stockQuantity?: number;
  selectedOptions: Record<string, string>; // groupId -> optionId
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  currency: string;
  compareAtPrice?: number;
  variantGroups: VariantGroup[];
  variants: ProductVariant[];
  defaultVariantId?: string;
  sceneObjectId?: string; // Link to 3D object in scene
  hotspots: Hotspot[];
  metadata?: Record<string, any>;
}

// ============== PRICING CALCULATOR ==============

export interface PriceBreakdown {
  basePrice: number;
  optionModifiers: Array<{
    groupName: string;
    optionName: string;
    amount: number;
  }>;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discountCode?: string;
  discountAmount?: number;
  discountType?: 'fixed' | 'percentage';
  shippingCost?: number;
  total: number;
  currency: string;
  formattedTotal: string;
}

export interface PricingRule {
  id: string;
  name: string;
  type: 'quantity_discount' | 'bundle' | 'tiered' | 'custom';
  conditions: {
    minQuantity?: number;
    maxQuantity?: number;
    variantIds?: string[];
    optionIds?: string[];
  };
  discount: {
    type: 'fixed' | 'percentage';
    value: number;
  };
  priority: number;
  active: boolean;
}

// ============== E-COMMERCE INTEGRATION ==============

export type EcommercePlatform = 'shopify' | 'woocommerce' | 'bigcommerce' | 'custom';

export interface EcommerceCredentials {
  platform: EcommercePlatform;
  shopify?: {
    shopDomain: string;
    accessToken: string;
    apiVersion?: string;
  };
  woocommerce?: {
    siteUrl: string;
    consumerKey: string;
    consumerSecret: string;
  };
  bigcommerce?: {
    storeHash: string;
    accessToken: string;
    clientId: string;
  };
  custom?: {
    apiEndpoint: string;
    apiKey?: string;
    headers?: Record<string, string>;
  };
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  selectedOptions: Record<string, string>;
  price: number;
  name: string;
  imageUrl?: string;
  sku?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  currency: string;
  discountCode?: string;
}

export interface CheckoutData {
  cart: Cart;
  customer?: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  shippingAddress?: {
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  checkoutUrl?: string;
  error?: string;
}

// ============== CONFIGURATOR STATE ==============

export interface ConfiguratorState {
  product: Product | null;
  selectedVariantId: string | null;
  selectedOptions: Record<string, string>; // groupId -> optionId
  quantity: number;
  priceBreakdown: PriceBreakdown | null;
  cart: Cart;
  activeHotspot: string | null;
  ecommerceConnected: boolean;
  ecommercePlatform: EcommercePlatform | null;
}

// ============== API TYPES ==============

export interface ConfiguratorAPIRequest {
  action: 'calculate_price' | 'add_to_cart' | 'checkout' | 'sync_product' | 'get_inventory';
  payload: any;
}

export interface ConfiguratorAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

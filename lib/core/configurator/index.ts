/**
 * Configurator Module
 *
 * Product configurator system with:
 * - Hotspots with annotations and tooltips
 * - Variant-based pricing calculator
 * - E-commerce integration (Shopify, WooCommerce, BigCommerce)
 * - API for custom configurator logic
 */

// Types
export * from './types';

// Pricing Calculator
export {
  formatPrice,
  calculatePrice,
  calculateCartTotals,
  getSelectedVariant,
  isVariantAvailable,
  getAvailableOptions,
  validateDiscountCode,
  createCartItem,
} from './pricing-calculator';

// E-commerce Adapters
export {
  createEcommerceAdapter,
  ShopifyAdapter,
  WooCommerceAdapter,
  BigCommerceAdapter,
  CustomEcommerceAdapter,
  type EcommerceAdapter,
} from './ecommerce-adapters';

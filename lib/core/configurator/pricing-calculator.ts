/**
 * Pricing Calculator
 *
 * Calculates product prices based on selected variants and options,
 * applying discounts, taxes, and shipping costs.
 */

import type {
  Product,
  VariantGroup,
  VariantOption,
  PriceBreakdown,
  PricingRule,
  Cart,
  CartItem,
} from './types';

// Currency formatters cache
const formatters: Record<string, Intl.NumberFormat> = {};

function getFormatter(currency: string): Intl.NumberFormat {
  if (!formatters[currency]) {
    formatters[currency] = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    });
  }
  return formatters[currency];
}

export function formatPrice(amount: number, currency: string): string {
  return getFormatter(currency).format(amount);
}

/**
 * Calculate the price for a product with selected options
 */
export function calculatePrice(
  product: Product,
  selectedOptions: Record<string, string>,
  quantity: number = 1,
  pricingRules: PricingRule[] = [],
  taxRate: number = 0,
  discountCode?: string,
  discountValue?: number,
  discountType?: 'fixed' | 'percentage'
): PriceBreakdown {
  const currency = product.currency;
  let basePrice = product.basePrice;

  // Calculate option modifiers
  const optionModifiers: PriceBreakdown['optionModifiers'] = [];

  for (const group of product.variantGroups) {
    const selectedOptionId = selectedOptions[group.id];
    if (!selectedOptionId) continue;

    const option = group.options.find((o) => o.id === selectedOptionId);
    if (!option) continue;

    let modifierAmount = 0;
    if (option.priceModifierType === 'fixed') {
      modifierAmount = option.priceModifier;
    } else if (option.priceModifierType === 'percentage') {
      modifierAmount = basePrice * (option.priceModifier / 100);
    }

    if (modifierAmount !== 0) {
      optionModifiers.push({
        groupName: group.name,
        optionName: option.name,
        amount: modifierAmount,
      });
    }
  }

  // Calculate subtotal
  const optionTotal = optionModifiers.reduce((sum, mod) => sum + mod.amount, 0);
  const unitPrice = basePrice + optionTotal;
  let subtotal = unitPrice * quantity;

  // Apply pricing rules (quantity discounts, bundles, etc.)
  let ruleDiscount = 0;
  const applicableRules = pricingRules
    .filter((rule) => rule.active)
    .filter((rule) => {
      if (rule.type === 'quantity_discount') {
        const { minQuantity, maxQuantity } = rule.conditions;
        if (minQuantity && quantity < minQuantity) return false;
        if (maxQuantity && quantity > maxQuantity) return false;
        return true;
      }
      return false;
    })
    .sort((a, b) => b.priority - a.priority);

  if (applicableRules.length > 0) {
    const rule = applicableRules[0]; // Apply highest priority rule
    if (rule.discount.type === 'fixed') {
      ruleDiscount = rule.discount.value;
    } else {
      ruleDiscount = subtotal * (rule.discount.value / 100);
    }
  }

  subtotal -= ruleDiscount;

  // Apply discount code
  let discountAmount = 0;
  if (discountCode && discountValue) {
    if (discountType === 'fixed') {
      discountAmount = discountValue;
    } else if (discountType === 'percentage') {
      discountAmount = subtotal * (discountValue / 100);
    }
  }

  const afterDiscount = subtotal - discountAmount;

  // Calculate tax
  const taxAmount = taxRate > 0 ? afterDiscount * (taxRate / 100) : 0;

  // Calculate total
  const total = afterDiscount + taxAmount;

  return {
    basePrice,
    optionModifiers,
    subtotal: unitPrice * quantity,
    taxRate: taxRate > 0 ? taxRate : undefined,
    taxAmount: taxAmount > 0 ? taxAmount : undefined,
    discountCode,
    discountAmount: discountAmount > 0 ? discountAmount : undefined,
    discountType,
    total,
    currency,
    formattedTotal: formatPrice(total, currency),
  };
}

/**
 * Calculate cart totals
 */
export function calculateCartTotals(
  cart: Omit<Cart, 'subtotal' | 'total'>,
  taxRate: number = 0
): Cart {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const afterDiscount = subtotal - (cart.discountAmount || 0);
  const taxAmount = taxRate > 0 ? afterDiscount * (taxRate / 100) : 0;
  const total = afterDiscount + taxAmount + (cart.shippingCost || 0);

  return {
    ...cart,
    subtotal,
    taxAmount,
    total,
  };
}

/**
 * Get the final variant based on selected options
 */
export function getSelectedVariant(
  product: Product,
  selectedOptions: Record<string, string>
): { variant: typeof product.variants[0] | null; isExactMatch: boolean } {
  // Try to find exact match
  const exactMatch = product.variants.find((variant) => {
    for (const [groupId, optionId] of Object.entries(selectedOptions)) {
      if (variant.selectedOptions[groupId] !== optionId) {
        return false;
      }
    }
    return true;
  });

  if (exactMatch) {
    return { variant: exactMatch, isExactMatch: true };
  }

  // Find closest match (most options matching)
  let bestMatch = null;
  let bestMatchCount = 0;

  for (const variant of product.variants) {
    let matchCount = 0;
    for (const [groupId, optionId] of Object.entries(selectedOptions)) {
      if (variant.selectedOptions[groupId] === optionId) {
        matchCount++;
      }
    }
    if (matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestMatch = variant;
    }
  }

  return { variant: bestMatch, isExactMatch: false };
}

/**
 * Check if a variant combination is available
 */
export function isVariantAvailable(
  product: Product,
  selectedOptions: Record<string, string>
): boolean {
  const { variant } = getSelectedVariant(product, selectedOptions);
  if (!variant) return false;
  return variant.available && (variant.stockQuantity === undefined || variant.stockQuantity > 0);
}

/**
 * Get available options for a group based on current selections
 */
export function getAvailableOptions(
  product: Product,
  groupId: string,
  currentSelections: Record<string, string>
): VariantOption[] {
  const group = product.variantGroups.find((g) => g.id === groupId);
  if (!group) return [];

  // Filter options based on what variants are available
  return group.options.filter((option) => {
    const testSelections = { ...currentSelections, [groupId]: option.id };

    // Check if any variant matches this combination
    return product.variants.some((variant) => {
      let matches = true;
      for (const [gId, oId] of Object.entries(testSelections)) {
        if (variant.selectedOptions[gId] !== oId) {
          matches = false;
          break;
        }
      }
      return matches && variant.available;
    });
  });
}

/**
 * Apply a discount code
 */
export function validateDiscountCode(
  code: string,
  availableCodes: Array<{
    code: string;
    type: 'fixed' | 'percentage';
    value: number;
    minPurchase?: number;
    maxUses?: number;
    currentUses?: number;
    expiresAt?: Date;
  }>,
  cartTotal: number
): { valid: boolean; type?: 'fixed' | 'percentage'; value?: number; error?: string } {
  const discount = availableCodes.find(
    (d) => d.code.toLowerCase() === code.toLowerCase()
  );

  if (!discount) {
    return { valid: false, error: 'Invalid discount code' };
  }

  if (discount.expiresAt && new Date() > discount.expiresAt) {
    return { valid: false, error: 'This discount code has expired' };
  }

  if (discount.maxUses && discount.currentUses && discount.currentUses >= discount.maxUses) {
    return { valid: false, error: 'This discount code has reached its usage limit' };
  }

  if (discount.minPurchase && cartTotal < discount.minPurchase) {
    return {
      valid: false,
      error: `Minimum purchase of ${formatPrice(discount.minPurchase, 'USD')} required`,
    };
  }

  return {
    valid: true,
    type: discount.type,
    value: discount.value,
  };
}

/**
 * Create a cart item from product and selections
 */
export function createCartItem(
  product: Product,
  selectedOptions: Record<string, string>,
  quantity: number = 1
): CartItem | null {
  const priceBreakdown = calculatePrice(product, selectedOptions, 1);
  const { variant } = getSelectedVariant(product, selectedOptions);

  // Build option names for display
  const optionNames: string[] = [];
  for (const group of product.variantGroups) {
    const optionId = selectedOptions[group.id];
    if (optionId) {
      const option = group.options.find((o) => o.id === optionId);
      if (option) {
        optionNames.push(`${group.name}: ${option.name}`);
      }
    }
  }

  return {
    productId: product.id,
    variantId: variant?.id || product.id,
    quantity,
    selectedOptions,
    price: priceBreakdown.total / quantity, // Unit price
    name: optionNames.length > 0 ? `${product.name} (${optionNames.join(', ')})` : product.name,
    imageUrl: variant?.images[0] || product.variants[0]?.images[0],
    sku: variant?.sku,
  };
}

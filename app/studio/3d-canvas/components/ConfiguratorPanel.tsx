'use client';

/**
 * ConfiguratorPanel - Product Configurator UI
 *
 * Manages product variants, pricing calculator, and cart functionality.
 */

import React, { useState, useMemo, useEffect } from 'react';
import type {
  Product,
  VariantGroup,
  VariantOption,
  PriceBreakdown,
  Cart,
  CartItem,
} from '@/lib/core/configurator/types';
import {
  calculatePrice,
  formatPrice,
  getSelectedVariant,
  isVariantAvailable,
  getAvailableOptions,
  createCartItem,
  calculateCartTotals,
} from '@/lib/core/configurator/pricing-calculator';
import {
  ShoppingCart,
  Plus,
  Minus,
  Check,
  X,
  Tag,
  Truck,
  CreditCard,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Package,
  Palette,
  Ruler,
  Box,
  Trash2,
} from 'lucide-react';

// ============== VARIANT GROUP SELECTOR ==============

interface VariantGroupSelectorProps {
  group: VariantGroup;
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
  availableOptions: VariantOption[];
}

function VariantGroupSelector({
  group,
  selectedOptionId,
  onSelect,
  availableOptions,
}: VariantGroupSelectorProps) {
  const getGroupIcon = () => {
    switch (group.type) {
      case 'color':
        return <Palette size={14} />;
      case 'size':
        return <Ruler size={14} />;
      case 'material':
        return <Box size={14} />;
      default:
        return <Tag size={14} />;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-gray-400">{getGroupIcon()}</span>
        <label className="text-sm font-medium text-gray-300">
          {group.name}
          {group.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      </div>

      {group.type === 'color' ? (
        // Color swatches
        <div className="flex flex-wrap gap-2">
          {group.options.map((option) => {
            const isAvailable = availableOptions.some((o) => o.id === option.id);
            const isSelected = selectedOptionId === option.id;

            return (
              <button
                key={option.id}
                onClick={() => isAvailable && onSelect(option.id)}
                disabled={!isAvailable}
                className={`relative w-10 h-10 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-white scale-110 shadow-lg'
                    : isAvailable
                    ? 'border-gray-600 hover:border-gray-400'
                    : 'border-gray-800 opacity-40 cursor-not-allowed'
                }`}
                style={{ backgroundColor: option.value }}
                title={option.name}
              >
                {isSelected && (
                  <Check
                    size={16}
                    className="absolute inset-0 m-auto text-white drop-shadow-lg"
                  />
                )}
                {!isAvailable && (
                  <X size={14} className="absolute inset-0 m-auto text-gray-500" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        // Button group
        <div className="flex flex-wrap gap-2">
          {group.options.map((option) => {
            const isAvailable = availableOptions.some((o) => o.id === option.id);
            const isSelected = selectedOptionId === option.id;

            return (
              <button
                key={option.id}
                onClick={() => isAvailable && onSelect(option.id)}
                disabled={!isAvailable}
                className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : isAvailable
                    ? 'border-gray-700 text-gray-300 hover:border-gray-500'
                    : 'border-gray-800 text-gray-600 cursor-not-allowed'
                }`}
              >
                {option.name}
                {option.priceModifier !== 0 && (
                  <span className="ml-1 text-xs text-gray-500">
                    {option.priceModifier > 0 ? '+' : ''}
                    {option.priceModifierType === 'percentage'
                      ? `${option.priceModifier}%`
                      : formatPrice(option.priceModifier, 'USD')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============== PRICE DISPLAY ==============

interface PriceDisplayProps {
  priceBreakdown: PriceBreakdown | null;
  compareAtPrice?: number;
}

function PriceDisplay({ priceBreakdown, compareAtPrice }: PriceDisplayProps) {
  if (!priceBreakdown) return null;

  const hasDiscount = compareAtPrice && compareAtPrice > priceBreakdown.total;
  const discountPercent = hasDiscount
    ? Math.round((1 - priceBreakdown.total / compareAtPrice) * 100)
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-white">
          {priceBreakdown.formattedTotal}
        </span>
        {hasDiscount && (
          <>
            <span className="text-lg text-gray-500 line-through">
              {formatPrice(compareAtPrice, priceBreakdown.currency)}
            </span>
            <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded">
              {discountPercent}% OFF
            </span>
          </>
        )}
      </div>

      {priceBreakdown.optionModifiers.length > 0 && (
        <div className="text-xs text-gray-500">
          Base: {formatPrice(priceBreakdown.basePrice, priceBreakdown.currency)}
          {priceBreakdown.optionModifiers.map((mod, i) => (
            <span key={i}>
              {' '}
              + {mod.optionName}: {formatPrice(mod.amount, priceBreakdown.currency)}
            </span>
          ))}
        </div>
      )}

      {priceBreakdown.discountAmount && priceBreakdown.discountAmount > 0 && (
        <div className="text-xs text-green-400">
          Discount ({priceBreakdown.discountCode}): -
          {formatPrice(priceBreakdown.discountAmount, priceBreakdown.currency)}
        </div>
      )}

      {priceBreakdown.taxAmount && priceBreakdown.taxAmount > 0 && (
        <div className="text-xs text-gray-500">
          Tax ({priceBreakdown.taxRate}%):{' '}
          {formatPrice(priceBreakdown.taxAmount, priceBreakdown.currency)}
        </div>
      )}
    </div>
  );
}

// ============== QUANTITY SELECTOR ==============

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  max?: number;
}

function QuantitySelector({ quantity, onChange, max }: QuantitySelectorProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Minus size={16} />
      </button>
      <input
        type="number"
        value={quantity}
        onChange={(e) => {
          const val = parseInt(e.target.value) || 1;
          onChange(Math.max(1, max ? Math.min(val, max) : val));
        }}
        className="w-16 text-center bg-[#1a1a1a] border border-gray-700 rounded-lg py-2 text-white"
        min={1}
        max={max}
      />
      <button
        onClick={() => onChange(max ? Math.min(quantity + 1, max) : quantity + 1)}
        disabled={max !== undefined && quantity >= max}
        className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

// ============== CART MINI VIEW ==============

interface CartMiniViewProps {
  cart: Cart;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
}

function CartMiniView({ cart, onRemoveItem, onCheckout }: CartMiniViewProps) {
  const [expanded, setExpanded] = useState(false);

  if (cart.items.length === 0) return null;

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-[#222] transition-colors"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-white">
            Cart ({cart.items.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">
            {formatPrice(cart.total, cart.currency)}
          </span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-700">
          <div className="max-h-48 overflow-y-auto">
            {cart.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border-b border-gray-800 last:border-0"
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.quantity} x {formatPrice(item.price, cart.currency)}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveItem(index)}
                  className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 space-y-2 bg-[#111]">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white">
                {formatPrice(cart.subtotal, cart.currency)}
              </span>
            </div>
            {cart.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tax</span>
                <span className="text-white">
                  {formatPrice(cart.taxAmount, cart.currency)}
                </span>
              </div>
            )}
            {cart.shippingCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Shipping</span>
                <span className="text-white">
                  {formatPrice(cart.shippingCost, cart.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-700">
              <span className="text-white">Total</span>
              <span className="text-white">
                {formatPrice(cart.total, cart.currency)}
              </span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              <CreditCard size={16} />
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== MAIN CONFIGURATOR PANEL ==============

interface ConfiguratorPanelProps {
  product: Product | null;
  onProductChange?: (product: Product) => void;
  onAddToCart?: (item: CartItem) => void;
  onCheckout?: (cart: Cart) => void;
  onVariantChange?: (selectedOptions: Record<string, string>) => void;
  taxRate?: number;
  showCart?: boolean;
}

export default function ConfiguratorPanel({
  product,
  onProductChange,
  onAddToCart,
  onCheckout,
  onVariantChange,
  taxRate = 0,
  showCart = true,
}: ConfiguratorPanelProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: 'fixed' | 'percentage';
    value: number;
  } | null>(null);
  const [cart, setCart] = useState<Cart>({
    items: [],
    subtotal: 0,
    taxAmount: 0,
    shippingCost: 0,
    discountAmount: 0,
    total: 0,
    currency: product?.currency || 'USD',
  });

  // Initialize with default selections
  useEffect(() => {
    if (product) {
      const defaults: Record<string, string> = {};
      for (const group of product.variantGroups) {
        if (group.options.length > 0) {
          // Find default variant or use first option
          const defaultVariant = product.variants.find(
            (v) => v.id === product.defaultVariantId
          );
          if (defaultVariant && defaultVariant.selectedOptions[group.id]) {
            defaults[group.id] = defaultVariant.selectedOptions[group.id];
          } else {
            defaults[group.id] = group.options[0].id;
          }
        }
      }
      setSelectedOptions(defaults);
    }
  }, [product]);

  // Notify parent of variant changes
  useEffect(() => {
    onVariantChange?.(selectedOptions);
  }, [selectedOptions, onVariantChange]);

  // Calculate price
  const priceBreakdown = useMemo(() => {
    if (!product) return null;
    return calculatePrice(
      product,
      selectedOptions,
      quantity,
      [],
      taxRate,
      appliedDiscount?.code,
      appliedDiscount?.value,
      appliedDiscount?.type
    );
  }, [product, selectedOptions, quantity, taxRate, appliedDiscount]);

  // Check availability
  const isAvailable = useMemo(() => {
    if (!product) return false;
    return isVariantAvailable(product, selectedOptions);
  }, [product, selectedOptions]);

  // Get selected variant info
  const { variant: selectedVariant } = useMemo(() => {
    if (!product) return { variant: null, isExactMatch: false };
    return getSelectedVariant(product, selectedOptions);
  }, [product, selectedOptions]);

  const handleOptionSelect = (groupId: string, optionId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [groupId]: optionId }));
  };

  const handleAddToCart = () => {
    if (!product || !priceBreakdown) return;

    const item = createCartItem(product, selectedOptions, quantity);
    if (!item) return;

    const newCart = calculateCartTotals(
      {
        items: [...cart.items, item],
        taxAmount: 0,
        shippingCost: cart.shippingCost,
        discountAmount: cart.discountAmount,
        currency: product.currency,
        discountCode: cart.discountCode,
      },
      taxRate
    );

    setCart(newCart);
    onAddToCart?.(item);
  };

  const handleRemoveFromCart = (index: number) => {
    const newItems = cart.items.filter((_, i) => i !== index);
    const newCart = calculateCartTotals(
      {
        items: newItems,
        taxAmount: 0,
        shippingCost: cart.shippingCost,
        discountAmount: cart.discountAmount,
        currency: cart.currency,
        discountCode: cart.discountCode,
      },
      taxRate
    );
    setCart(newCart);
  };

  const handleCheckout = () => {
    onCheckout?.(cart);
  };

  if (!product) {
    return (
      <div className="p-4 text-center">
        <Package className="mx-auto mb-2 text-gray-600" size={24} />
        <p className="text-sm text-gray-500">No product configured</p>
        <p className="text-xs text-gray-600 mt-1">
          Set up a product to enable the configurator
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Product Info */}
      <div>
        <h3 className="text-lg font-semibold text-white">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-gray-400 mt-1">{product.description}</p>
        )}
      </div>

      {/* Price Display */}
      <PriceDisplay
        priceBreakdown={priceBreakdown}
        compareAtPrice={product.compareAtPrice}
      />

      {/* Variant Groups */}
      <div className="space-y-4">
        {product.variantGroups.map((group) => (
          <VariantGroupSelector
            key={group.id}
            group={group}
            selectedOptionId={selectedOptions[group.id] || null}
            onSelect={(optionId) => handleOptionSelect(group.id, optionId)}
            availableOptions={getAvailableOptions(product, group.id, selectedOptions)}
          />
        ))}
      </div>

      {/* Quantity & Add to Cart */}
      <div className="flex items-center gap-3">
        <QuantitySelector
          quantity={quantity}
          onChange={setQuantity}
          max={selectedVariant?.stockQuantity}
        />

        <button
          onClick={handleAddToCart}
          disabled={!isAvailable}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            isAvailable
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <ShoppingCart size={18} />
          {isAvailable ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>

      {/* Stock Warning */}
      {selectedVariant?.stockQuantity !== undefined &&
        selectedVariant.stockQuantity > 0 &&
        selectedVariant.stockQuantity <= 5 && (
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <AlertCircle size={14} />
            Only {selectedVariant.stockQuantity} left in stock
          </div>
        )}

      {/* Discount Code */}
      <div className="flex gap-2">
        <input
          type="text"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
          placeholder="Discount code"
          className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
        />
        <button
          onClick={() => {
            // In real implementation, validate code against backend
            if (discountCode) {
              setAppliedDiscount({
                code: discountCode,
                type: 'percentage',
                value: 10, // Mock 10% discount
              });
            }
          }}
          className="px-4 py-2 text-sm border border-gray-700 rounded-lg text-gray-300 hover:border-gray-500 transition-colors"
        >
          Apply
        </button>
      </div>

      {/* Shipping Info */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Truck size={14} />
        Free shipping on orders over $100
      </div>

      {/* Cart Mini View */}
      {showCart && (
        <CartMiniView
          cart={cart}
          onRemoveItem={handleRemoveFromCart}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
}

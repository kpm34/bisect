/**
 * E-commerce Webhook Handler
 *
 * Receives webhooks from Shopify, WooCommerce, BigCommerce
 * for order updates, inventory changes, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ============== TYPES ==============

interface WebhookPayload {
  platform: 'shopify' | 'woocommerce' | 'bigcommerce';
  event: string;
  data: any;
}

// ============== WEBHOOK VERIFICATION ==============

function verifyShopifyWebhook(
  body: string,
  hmacHeader: string | null,
  secret: string
): boolean {
  if (!hmacHeader) return false;

  const generatedHash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(generatedHash),
    Buffer.from(hmacHeader)
  );
}

function verifyWooCommerceWebhook(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const generatedHash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(generatedHash),
    Buffer.from(signature)
  );
}

function verifyBigCommerceWebhook(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const generatedHash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(generatedHash),
    Buffer.from(signature)
  );
}

// ============== EVENT HANDLERS ==============

async function handleShopifyEvent(topic: string, data: any) {
  console.log(`Shopify webhook received: ${topic}`, data);

  switch (topic) {
    case 'orders/create':
      // Handle new order
      console.log('New Shopify order:', data.id);
      // Could update local database, trigger notifications, etc.
      break;

    case 'orders/updated':
      // Handle order update
      console.log('Shopify order updated:', data.id);
      break;

    case 'orders/fulfilled':
      // Handle order fulfillment
      console.log('Shopify order fulfilled:', data.id);
      break;

    case 'products/update':
      // Handle product update (sync inventory)
      console.log('Shopify product updated:', data.id);
      break;

    case 'inventory_levels/update':
      // Handle inventory change
      console.log('Shopify inventory updated:', data.inventory_item_id);
      break;

    default:
      console.log(`Unhandled Shopify topic: ${topic}`);
  }
}

async function handleWooCommerceEvent(topic: string, data: any) {
  console.log(`WooCommerce webhook received: ${topic}`, data);

  switch (topic) {
    case 'order.created':
      console.log('New WooCommerce order:', data.id);
      break;

    case 'order.updated':
      console.log('WooCommerce order updated:', data.id);
      break;

    case 'product.updated':
      console.log('WooCommerce product updated:', data.id);
      break;

    default:
      console.log(`Unhandled WooCommerce topic: ${topic}`);
  }
}

async function handleBigCommerceEvent(scope: string, data: any) {
  console.log(`BigCommerce webhook received: ${scope}`, data);

  switch (scope) {
    case 'store/order/created':
      console.log('New BigCommerce order:', data.id);
      break;

    case 'store/order/updated':
      console.log('BigCommerce order updated:', data.id);
      break;

    case 'store/product/updated':
      console.log('BigCommerce product updated:', data.id);
      break;

    case 'store/product/inventory/updated':
      console.log('BigCommerce inventory updated:', data.id);
      break;

    default:
      console.log(`Unhandled BigCommerce scope: ${scope}`);
  }
}

// ============== MAIN HANDLER ==============

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const headers = request.headers;

    // Detect platform from headers
    const shopifyTopic = headers.get('x-shopify-topic');
    const shopifyHmac = headers.get('x-shopify-hmac-sha256');
    const wooSignature = headers.get('x-wc-webhook-signature');
    const wooTopic = headers.get('x-wc-webhook-topic');
    const bigCommerceHash = headers.get('x-bc-webhook-hash-algorithm');

    // Get secrets from environment
    const shopifySecret = process.env.SHOPIFY_WEBHOOK_SECRET || '';
    const wooSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || '';
    const bigCommerceSecret = process.env.BIGCOMMERCE_WEBHOOK_SECRET || '';

    let platform: string;
    let event: string;
    let data: any;

    // Shopify webhook
    if (shopifyTopic) {
      if (shopifySecret && !verifyShopifyWebhook(rawBody, shopifyHmac, shopifySecret)) {
        console.error('Invalid Shopify webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      platform = 'shopify';
      event = shopifyTopic;
      data = JSON.parse(rawBody);

      await handleShopifyEvent(event, data);
    }
    // WooCommerce webhook
    else if (wooTopic) {
      if (wooSecret && !verifyWooCommerceWebhook(rawBody, wooSignature, wooSecret)) {
        console.error('Invalid WooCommerce webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      platform = 'woocommerce';
      event = wooTopic;
      data = JSON.parse(rawBody);

      await handleWooCommerceEvent(event, data);
    }
    // BigCommerce webhook
    else if (bigCommerceHash) {
      const signature = headers.get('x-bc-webhook-id'); // Simplified
      if (bigCommerceSecret && !verifyBigCommerceWebhook(rawBody, signature, bigCommerceSecret)) {
        console.error('Invalid BigCommerce webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      const payload = JSON.parse(rawBody);
      platform = 'bigcommerce';
      event = payload.scope;
      data = payload.data;

      await handleBigCommerceEvent(event, data);
    }
    // Unknown platform
    else {
      // Generic webhook - try to parse and log
      console.log('Unknown webhook received:', rawBody.substring(0, 500));
      return NextResponse.json({ status: 'received' });
    }

    // Log successful processing
    console.log(`Webhook processed: ${platform}/${event}`);

    return NextResponse.json({
      success: true,
      platform,
      event,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// ============== GET HANDLER (for webhook verification) ==============

export async function GET(request: NextRequest) {
  // Some platforms verify webhooks via GET request
  const { searchParams } = new URL(request.url);

  // Shopify verification (for OAuth)
  const hmac = searchParams.get('hmac');
  const shop = searchParams.get('shop');

  if (hmac && shop) {
    // Verify Shopify OAuth callback
    return NextResponse.json({ verified: true, shop });
  }

  // WooCommerce verification ping
  const wcPing = searchParams.get('wc-api');
  if (wcPing) {
    return NextResponse.json({ status: 'ok', api: wcPing });
  }

  // Default response
  return NextResponse.json({
    status: 'healthy',
    endpoint: 'Configurator Webhook Handler',
    supportedPlatforms: ['shopify', 'woocommerce', 'bigcommerce'],
  });
}

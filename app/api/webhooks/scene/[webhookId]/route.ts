/**
 * Scene Variable Webhook Endpoint
 *
 * Receives external data and broadcasts to connected scene instances.
 * Supports HMAC signature verification for security.
 *
 * POST /api/webhooks/scene/[webhookId]
 * Headers:
 *   X-Webhook-Signature: HMAC-SHA256 signature (optional if secret configured)
 *   Content-Type: application/json
 * Body: JSON data to be extracted using jsonPath
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  getWebhookConfig,
  updateWebhookTimestamp,
  broadcastToSubscribers,
  getSubscriberCount,
} from '@/lib/services/webhook-store';

/**
 * Verify HMAC signature
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * POST handler - receive webhook data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  const { webhookId } = params;

  // Get raw body for signature verification
  const rawBody = await request.text();
  let data: any;

  try {
    data = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // Check if webhook exists
  const webhookConfig = getWebhookConfig(webhookId);

  // For now, allow unregistered webhooks for flexibility
  // In production, you might want to require registration

  // Verify signature if secret is configured
  if (webhookConfig?.secret) {
    const signature = request.headers.get('X-Webhook-Signature') || '';

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    if (!verifySignature(rawBody, signature, webhookConfig.secret)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 403 }
      );
    }
  }

  // Update last received timestamp
  updateWebhookTimestamp(webhookId);

  // Broadcast to subscribers
  const subscribersNotified = broadcastToSubscribers(webhookId, data);

  // Log for debugging
  console.log(`📥 Webhook received [${webhookId}]:`, {
    dataKeys: Object.keys(data),
    subscribers: subscribersNotified,
  });

  return NextResponse.json({
    success: true,
    webhookId,
    received: Date.now(),
    subscribersNotified,
  });
}

/**
 * GET handler - webhook info/health check
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  const { webhookId } = params;
  const webhookConfig = getWebhookConfig(webhookId);

  return NextResponse.json({
    webhookId,
    registered: !!webhookConfig,
    hasSecret: !!webhookConfig?.secret,
    lastReceived: webhookConfig?.lastReceived ?? null,
    activeSubscribers: getSubscriberCount(webhookId),
  });
}

/**
 * OPTIONS handler - CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Signature',
    },
  });
}

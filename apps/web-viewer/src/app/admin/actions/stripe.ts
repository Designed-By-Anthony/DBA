"use server";

import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { verifyAuth } from "../actions";

export interface StripeProductDetail {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  default_price: {
    id: string;
    unit_amount: number;
    currency: string;
    recurring: {
      interval: string;
      interval_count: number;
    } | null;
    type: 'one_time' | 'recurring';
  } | null;
  metadata: Record<string, string>;
}

// ------------------------------------------------------------------
// Fetching Data from Stripe
// ------------------------------------------------------------------

export async function getStripeProducts(): Promise<{ products: StripeProductDetail[], error?: string }> {
  try {
    // Basic auth check
    await verifyAuth();

    const response = await stripe.products.list({
      expand: ['data.default_price'],
      active: true,
      limit: 100,
    });

    const products = response.data.map((p): StripeProductDetail => {
      const raw = p.default_price;
      const price: Stripe.Price | null =
        raw && typeof raw !== "string" ? raw : null;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        active: p.active,
        metadata: p.metadata || {},
        default_price: price
          ? {
              id: price.id,
              unit_amount: price.unit_amount ?? 0,
              currency: price.currency,
              recurring: price.recurring
                ? {
                    interval: price.recurring.interval,
                    interval_count: price.recurring.interval_count,
                  }
                : null,
              type: price.type === "recurring" ? "recurring" : "one_time",
            }
          : null,
      };
    });

    return { products };
  } catch (err: unknown) {
    console.error("[Stripe Sync Error]", err);
    return {
      products: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ------------------------------------------------------------------
// Creating Products inside Stripe via Agency OS
// ------------------------------------------------------------------

export async function createStripeProductAction(params: {
  name: string;
  description?: string;
  priceAmountCents: number;
  interval?: 'month' | 'year' | 'one_time';
  inventoryManaged?: boolean;
  is86ed?: boolean;
}): Promise<{ product?: StripeProductDetail, error?: string }> {
  try {
    await verifyAuth();

    // 1. Create the Product
    const newProduct = await stripe.products.create({
      name: params.name,
      description: params.description || undefined,
      metadata: {
        created_via: 'agency_os', // Mark this for origin tracking
        inventory_managed: params.inventoryManaged ? 'true' : 'false',
        is_86ed: params.is86ed ? 'true' : 'false'
      }
    });

    // 2. Create the Price and attach it
    const priceData: Stripe.PriceCreateParams = {
      product: newProduct.id,
      unit_amount: params.priceAmountCents,
      currency: "usd",
    };

    if (params.interval && params.interval !== "one_time") {
      priceData.recurring = { interval: params.interval };
    }

    const newPrice = await stripe.prices.create(priceData);

    // 3. Set the price as the default for the product
    const updatedProduct = await stripe.products.update(newProduct.id, {
      default_price: newPrice.id,
    });

    // Standardize object for return
    return {
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description,
        active: updatedProduct.active,
        metadata: updatedProduct.metadata || {},
        default_price: {
          id: newPrice.id,
          unit_amount: newPrice.unit_amount || 0,
          currency: newPrice.currency,
          recurring: newPrice.recurring
            ? {
                interval: newPrice.recurring.interval,
                interval_count: newPrice.recurring.interval_count,
              }
            : null,
          type: newPrice.type === "recurring" ? "recurring" : "one_time",
        },
      },
    };
  } catch (err: unknown) {
    console.error("[Create Product Error]", err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

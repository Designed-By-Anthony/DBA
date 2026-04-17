import * as React from "react";
import type { RestaurantLeadMetadata } from "../vertical-metadata";

/**
 * Restaurant feature set — Menu Management + Daily Order feed.
 *
 * Menu items live on `tenants.crm_config.menu`; each order pulls from
 * `leads.metadata.orderItems`. Stays mobile-first (stacked grid) because
 * the owner is on their feet, not behind a desk.
 */
export type RestaurantMenuItem = {
  sku: string;
  name: string;
  priceCents: number;
  active: boolean;
  dietaryTags?: string[];
};

export type RestaurantOrder = {
  id: string;
  prospectName: string;
  placedAt?: string;
  metadata: RestaurantLeadMetadata | undefined | null;
};

export type RestaurantFeatureSetProps = {
  menu: RestaurantMenuItem[];
  orders: RestaurantOrder[];
  onEditItem?: (sku: string) => void;
};

export function RestaurantFeatureSet({ menu, orders, onEditItem }: RestaurantFeatureSetProps) {
  return (
    <section aria-label="Restaurant feature set" data-vertical="restaurant" className="space-y-4">
      <div data-slot="menu-management" className="rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-white/80">
            Menu Management
          </h4>
          <span className="text-[10px] text-white/50">{menu.length} items</span>
        </div>
        {menu.length === 0 ? (
          <p className="text-xs text-white/50">No menu items configured.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {menu.map((item) => (
              <li
                key={item.sku}
                className="rounded border border-white/10 bg-black/20 p-2 text-xs text-white flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  <div className="text-[11px] text-white/50">
                    {formatUsd(item.priceCents)}
                    {item.active ? null : (
                      <span className="ml-2 text-red-300">· 86'd</span>
                    )}
                  </div>
                </div>
                {onEditItem ? (
                  <button
                    type="button"
                    onClick={() => onEditItem(item.sku)}
                    className="text-[11px] text-blue-300 hover:text-blue-200"
                  >
                    Edit
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div data-slot="daily-order-feed" className="rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-white/80">
            Daily Order Feed
          </h4>
          <span className="text-[10px] text-white/50">{orders.length}</span>
        </div>
        {orders.length === 0 ? (
          <p className="text-xs text-white/50">No orders yet today.</p>
        ) : (
          <ul className="space-y-2">
            {orders.slice(0, 25).map((o) => (
              <li
                key={o.id}
                className="rounded border border-white/10 bg-black/20 p-2 text-xs text-white"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{o.prospectName}</span>
                  {o.metadata?.tableNumber ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 rounded px-1">
                      Table {o.metadata.tableNumber}
                    </span>
                  ) : null}
                </div>
                <div className="text-[11px] text-white/50">
                  {o.metadata?.orderTotalCents != null
                    ? formatUsd(o.metadata.orderTotalCents)
                    : "—"}
                  {o.metadata?.source ? ` · ${o.metadata.source}` : ""}
                </div>
                {o.metadata?.dietaryTags?.length ? (
                  <div className="text-[10px] text-white/60 mt-1 flex flex-wrap gap-1">
                    {o.metadata.dietaryTags.map((t) => (
                      <span key={t} className="rounded bg-white/10 px-1">
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

"use client";

/**
 * Retail vertical — inventory / storefront-adjacent surface (placeholder).
 * Shown when `tenant.vertical === "retail"` (Postgres `vertical_type`).
 */
export default function RetailWorkbench() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
      <span className="text-white font-medium">Retail workbench</span>
      <span>— catalog, pickup, and POS hooks wire in here.</span>
    </div>
  );
}

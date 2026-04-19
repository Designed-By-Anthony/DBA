/**
 * PrintNode — Cloud printing for receipts, kitchen tickets, and labels.
 *
 * Uses the PrintNode REST API to dispatch print jobs.
 * Requires PRINTNODE_API_KEY and a printer ID from hardware_devices table.
 */

const PRINTNODE_BASE = "https://api.printnode.com";

function getApiKey(): string {
  const key = process.env.PRINTNODE_API_KEY;
  if (!key) throw new Error("PRINTNODE_API_KEY is not configured");
  return key;
}

function authHeaders(): Record<string, string> {
  const key = getApiKey();
  return {
    Authorization: `Basic ${Buffer.from(key + ":").toString("base64")}`,
    "Content-Type": "application/json",
  };
}

export type PrintJobOptions = {
  printerId: number;
  title: string;
  contentType: "raw_uri" | "pdf_uri" | "pdf_base64" | "raw_base64";
  content: string;
  copies?: number;
  /** Optional: paper size / tray selection */
  options?: Record<string, unknown>;
};

/**
 * Submit a print job to PrintNode.
 * Returns the job ID on success.
 */
export async function submitPrintJob(opts: PrintJobOptions): Promise<number> {
  const res = await fetch(`${PRINTNODE_BASE}/printjobs`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      printerId: opts.printerId,
      title: opts.title,
      contentType: opts.contentType,
      content: opts.content,
      qty: opts.copies ?? 1,
      options: opts.options,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PrintNode error (${res.status}): ${body}`);
  }

  return (await res.json()) as number;
}

/** List available printers from PrintNode account. */
export async function listPrinters(): Promise<
  Array<{
    id: number;
    name: string;
    description: string;
    state: string;
    computer: { id: number; name: string };
  }>
> {
  const res = await fetch(`${PRINTNODE_BASE}/printers`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PrintNode error (${res.status}): ${body}`);
  }

  return res.json();
}

/**
 * Format a text receipt for ESC/POS thermal printers.
 * Returns a base64-encoded string ready for `raw_base64` content type.
 */
export function formatTextReceipt(data: {
  storeName: string;
  orderNumber: string;
  items: Array<{ name: string; qty: number; priceCents: number }>;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  paymentMethod: string;
  cashTenderedCents?: number;
  changeDueCents?: number;
  dateTime: string;
}): string {
  const lines: string[] = [];
  const w = 32; // typical 80mm receipt width in chars

  const center = (s: string) => {
    const pad = Math.max(0, Math.floor((w - s.length) / 2));
    return " ".repeat(pad) + s;
  };
  const divider = "-".repeat(w);
  const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const lineItem = (name: string, amount: string) => {
    const gap = w - name.length - amount.length;
    return name + " ".repeat(Math.max(1, gap)) + amount;
  };

  lines.push(center(data.storeName));
  lines.push(center(data.dateTime));
  lines.push(divider);
  lines.push(center(`Order #${data.orderNumber}`));
  lines.push(divider);

  for (const item of data.items) {
    const label = item.qty > 1 ? `${item.qty}x ${item.name}` : item.name;
    lines.push(lineItem(label, money(item.priceCents * item.qty)));
  }

  lines.push(divider);
  lines.push(lineItem("Subtotal", money(data.subtotalCents)));
  lines.push(lineItem("Tax", money(data.taxCents)));
  lines.push(divider);
  lines.push(lineItem("TOTAL", money(data.totalCents)));
  lines.push("");
  lines.push(lineItem("Paid via", data.paymentMethod.toUpperCase()));

  if (data.cashTenderedCents !== undefined) {
    lines.push(lineItem("Cash Tendered", money(data.cashTenderedCents)));
  }
  if (data.changeDueCents !== undefined && data.changeDueCents > 0) {
    lines.push(lineItem("Change Due", money(data.changeDueCents)));
  }

  lines.push("");
  lines.push(center("Thank you!"));
  lines.push("");

  const text = lines.join("\n");
  return Buffer.from(text).toString("base64");
}

/**
 * Format a kitchen ticket for the KDS printer.
 */
export function formatKitchenTicket(data: {
  orderNumber: string;
  orderType: string;
  tableName?: string;
  items: Array<{ name: string; qty: number; modifiers?: string[] }>;
  notes?: string;
  dateTime: string;
}): string {
  const lines: string[] = [];
  const w = 32;
  const divider = "=".repeat(w);

  lines.push(divider);
  lines.push(`ORDER #${data.orderNumber}`);
  lines.push(`Type: ${data.orderType.toUpperCase()}`);
  if (data.tableName) lines.push(`Table: ${data.tableName}`);
  lines.push(`Time: ${data.dateTime}`);
  lines.push(divider);

  for (const item of data.items) {
    lines.push(`${item.qty}x ${item.name}`);
    if (item.modifiers?.length) {
      for (const mod of item.modifiers) {
        lines.push(`   + ${mod}`);
      }
    }
  }

  if (data.notes) {
    lines.push(divider);
    lines.push(`NOTES: ${data.notes}`);
  }

  lines.push(divider);
  lines.push("");

  const text = lines.join("\n");
  return Buffer.from(text).toString("base64");
}

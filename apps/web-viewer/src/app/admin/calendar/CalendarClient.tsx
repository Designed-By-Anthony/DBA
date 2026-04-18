"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useAdminPrefix } from "@/lib/useAdminPrefix";
import { getCalendarBookings, type CalendarBooking } from "./actions";

type ViewMode = "week" | "month";

function dayKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

/** Ensures Calendly iframe gets embed mode (public URL only — safe for client). */
function calendlyIframeSrc(raw: string): string {
  try {
    const u = new URL(raw.trim());
    if (u.hostname !== "calendly.com") return raw.trim();
    if (!u.searchParams.has("embed")) u.searchParams.set("embed", "true");
    return u.toString();
  } catch {
    return raw.trim();
  }
}

const CALENDLY_EMBED_URL = process.env.NEXT_PUBLIC_CALENDLY_EMBED_URL?.trim();

export default function CalendarClient() {
  const stripAdmin = useAdminPrefix();
  const [cursor, setCursor] = useState(() => new Date());
  const [mode, setMode] = useState<ViewMode>("week");
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    if (mode === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: 1 });
      const end = addWeeks(start, 1);
      const lastDay = addDays(start, 6);
      return {
        start,
        end,
        label: `${format(start, "MMM d")} – ${format(lastDay, "MMM d, yyyy")}`,
      };
    }
    const start = startOfMonth(cursor);
    const end = addMonths(start, 1);
    return {
      start,
      end,
      label: format(start, "MMMM yyyy"),
    };
  }, [cursor, mode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await getCalendarBookings(
        range.start.toISOString(),
        range.end.toISOString(),
      );
      if (cancelled) return;
      if (res.ok) {
        setBookings(res.items);
      } else {
        setError(res.error);
        setBookings([]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [range.start, range.end]);

  function navigate(dir: -1 | 1) {
    if (mode === "week") {
      setCursor((d) => addWeeks(d, dir));
    } else {
      setCursor((d) => addMonths(d, dir));
    }
  }

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    for (const b of bookings) {
      const key = dayKey(new Date(b.scheduledTime));
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    }
    return map;
  }, [bookings]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [cursor]);

  const monthCells = useMemo(() => {
    const monthStart = startOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [cursor]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Calendar &amp; Bookings
          </h1>
          <p className="text-text-muted">
            Calls booked via Calendly appear here from your CRM timeline (
            <code className="text-xs text-text-muted/90">call_booked</code>
            ).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-glass-border bg-surface-1 p-0.5">
            <button
              type="button"
              onClick={() => setMode("week")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "week"
                  ? "bg-(--color-brand) text-white"
                  : "text-text-muted hover:text-white"
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setMode("month")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "month"
                  ? "bg-(--color-brand) text-white"
                  : "text-text-muted hover:text-white"
              }`}
            >
              Month
            </button>
          </div>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="rounded-lg border border-glass-border bg-surface-1 px-4 py-2 text-sm text-text-muted cursor-not-allowed opacity-70"
          >
            + Add time off
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-surface-1 border border-glass-border rounded-2xl p-4 sm:p-6 min-h-[420px]">
          <div className="flex items-center justify-between gap-2 mb-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg border border-glass-border text-text-muted hover:text-white hover:bg-surface-3 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-center min-w-0 flex-1">
              <p className="font-semibold text-white truncate">{range.label}</p>
              {loading && (
                <p className="text-xs text-text-muted mt-1">Loading…</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate(1)}
              className="p-2 rounded-lg border border-glass-border text-text-muted hover:text-white hover:bg-surface-3 transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {mode === "week" ? (
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
              {weekDays.map((day) => {
                const key = dayKey(day);
                const dayBookings = byDay.get(key) ?? [];
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-glass-border bg-surface-2/50 min-h-[200px] flex flex-col"
                  >
                    <div className="border-b border-glass-border px-2 py-2 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        {format(day, "EEE")}
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          isSameDay(day, new Date())
                            ? "text-(--color-brand)"
                            : "text-white"
                        }`}
                      >
                        {format(day, "d")}
                      </p>
                    </div>
                    <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[280px]">
                      {dayBookings.length === 0 ? (
                        <p className="text-[11px] text-text-muted text-center py-4">
                          —
                        </p>
                      ) : (
                        dayBookings.map((b) => (
                          <BookingCard
                            key={b.id}
                            booking={b}
                            stripAdmin={stripAdmin}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-7 gap-px text-center text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthCells.map((day) => {
                  const key = dayKey(day);
                  const inMonth = isSameMonth(day, cursor);
                  const dayBookings = byDay.get(key) ?? [];
                  return (
                    <div
                      key={key}
                      className={`min-h-[72px] rounded-lg border p-1 text-left ${
                        inMonth
                          ? "border-glass-border bg-surface-2/40"
                          : "border-transparent bg-surface-2/10 opacity-50"
                      }`}
                    >
                      <p
                        className={`text-xs font-medium mb-1 ${
                          isSameDay(day, new Date()) && inMonth
                            ? "text-(--color-brand)"
                            : inMonth
                              ? "text-white"
                              : "text-text-muted"
                        }`}
                      >
                        {format(day, "d")}
                      </p>
                      <div className="space-y-0.5">
                        {dayBookings.slice(0, 2).map((b) => (
                          <p
                            key={b.id}
                            className="text-[9px] leading-tight text-text-muted truncate"
                            title={b.title}
                          >
                            {format(new Date(b.scheduledTime), "h:mm a")}
                          </p>
                        ))}
                        {dayBookings.length > 2 && (
                          <p className="text-[9px] text-(--color-brand)">
                            +{dayBookings.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-96 space-y-4">
          <div className="bg-surface-1 border border-glass-border rounded-2xl p-6">
            <h2 className="font-semibold text-white border-b border-glass-border pb-3 mb-3">
              Upcoming in view
            </h2>
            {loading && !bookings.length ? (
              <p className="text-sm text-text-muted">Loading…</p>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-text-muted leading-relaxed">
                No Calendly bookings in this range. New bookings create a{" "}
                <span className="text-white/90">call_booked</span> activity when
                the Calendly webhook runs for your organization.
              </p>
            ) : (
              <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {bookings.map((b) => (
                  <li
                    key={b.id}
                    className="rounded-lg border border-glass-border bg-surface-2/50 p-3 text-sm"
                  >
                    <p className="font-medium text-white">{b.contactName}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {format(new Date(b.scheduledTime), "EEE MMM d · h:mm a")}
                    </p>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">
                      {b.title}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={stripAdmin(`/admin/prospects/${b.leadId}`)}
                        className="text-xs font-medium text-(--color-brand) hover:underline"
                      >
                        Open prospect
                      </Link>
                      {b.eventUrl ? (
                        <a
                          href={b.eventUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-white"
                        >
                          Calendly
                          <ExternalLink size={12} />
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {CALENDLY_EMBED_URL ? (
            <div className="bg-surface-1 border border-glass-border rounded-2xl overflow-hidden">
              <h2 className="font-semibold text-white border-b border-glass-border px-4 py-3 text-sm">
                Schedule (Calendly)
              </h2>
              <div className="relative w-full aspect-[4/5] min-h-[420px]">
                <iframe
                  title="Calendly scheduling"
                  src={calendlyIframeSrc(CALENDLY_EMBED_URL)}
                  className="absolute inset-0 h-full w-full border-0 bg-surface-0"
                  loading="lazy"
                />
              </div>
              <p className="text-[10px] text-text-muted px-4 py-2 border-t border-glass-border">
                Bookings still sync via your Calendly webhook into this CRM. Full
                event setup remains in Calendly.
              </p>
            </div>
          ) : null}

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
            <h2 className="font-semibold text-amber-500 mb-2">Deposits &amp; no-shows</h2>
            <p className="text-xs text-amber-400/90 leading-relaxed">
              Card holds and manual capture for no-shows are not wired here yet.
              Use Stripe and the prospect record for payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  stripAdmin,
}: {
  booking: CalendarBooking;
  stripAdmin: (h: string) => string;
}) {
  return (
    <div className="rounded-lg bg-surface-1 border border-glass-border p-2 text-left">
      <p className="text-[10px] font-semibold text-(--color-brand)">
        {format(new Date(booking.scheduledTime), "h:mm a")}
      </p>
      <p className="text-[11px] text-white font-medium truncate">
        {booking.contactName}
      </p>
      <p className="text-[10px] text-text-muted line-clamp-2 mt-0.5">
        {booking.title.replace(/^Booked:\s*/i, "")}
      </p>
      <Link
        href={stripAdmin(`/admin/prospects/${booking.leadId}`)}
        className="text-[10px] text-(--color-brand) hover:underline mt-1 inline-block"
      >
        Prospect
      </Link>
    </div>
  );
}

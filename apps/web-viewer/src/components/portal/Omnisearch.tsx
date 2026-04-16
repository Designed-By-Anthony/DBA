"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ArrowRight, Command } from "lucide-react";
import { searchOmni } from "@/app/admin/actions";
import { useAdminPrefix } from "@/lib/useAdminPrefix";

// Define Static Features mapped to routes
const SYSTEM_FEATURES = [
  { label: "Dashboard", href: "/admin", aliases: ["home", "main"] },
  { label: "Prospects Directory", href: "/admin/prospects", aliases: ["leads", "clients", "users"] },
  { label: "Pipeline Board", href: "/admin/pipeline", aliases: ["kanban", "deals", "stages"] },
  { label: "Email Campaigns", href: "/admin/email", aliases: ["blast", "send", "marketing"] },
  { label: "Client Tickets", href: "/admin/tickets", aliases: ["support", "help", "issues"] },
  { label: "Billing & Invoices", href: "/admin/billing", aliases: ["money", "finance", "pay"] },
  { label: "Automations", href: "/admin/automations", aliases: ["rules", "workflow", "triggers"] },
  { label: "Inbox", href: "/admin/inbox", aliases: ["messages", "chat", "notifications"] },
  { label: "Agency Settings", href: "/admin/settings", aliases: ["team", "profile", "invite", "members"] },
];

export default function Omnisearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prospects, setProspects] = useState<{ id: string; name: string; email: string; company: string }[]>([]);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Escape closes the dropdown. Cmd/Ctrl+K is reserved for the global CommandPalette
  // (admin/layout) — a second listener here caused only the top-bar input to react in E2E.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        if (prospects.length > 0) setProspects([]);
        return;
      }
      setLoading(true);
      const results = await searchOmni(query);
      setProspects(results);
      setLoading(false);
    }, 400); // 400ms buffer to save Firestore reads

    return () => clearTimeout(timer);
  }, [query, prospects.length]);

  // Static Feature Filtering
  const filteredFeatures = SYSTEM_FEATURES.filter((f) => {
    const q = query.toLowerCase();
    return f.label.toLowerCase().includes(q) || f.aliases.some((a) => a.includes(q));
  }).slice(0, 4); // Limit feature hits

  const handleRoute = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(stripAdmin(href));
  };

  const stripAdmin = useAdminPrefix();

  return (
    <div ref={wrapperRef} className="relative w-full max-w-sm hidden md:block">
      {/* Search Input Bar (Always Visible on TopBar) */}
      <div 
        onClick={() => setOpen(true)}
        className="relative flex items-center w-full h-10 px-3 bg-surface-2 border border-glass-border rounded-full hover:border-brand-ring transition-all cursor-text group"
      >
        <Search size={16} className="text-text-gray group-hover:text-(--color-brand) transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          placeholder="Search prospects or features..."
          className="w-full h-full pl-3 bg-transparent text-sm text-white placeholder-text-muted outline-none"
        />
        <div className="flex items-center gap-1 text-[10px] text-text-muted border border-glass-border rounded px-2 py-0.5 ml-2 shrink-0">
          <Command size={10} /> K
        </div>
      </div>

      {/* Glassmorphic Dropdown Palette */}
      {open && (query.length > 0 || prospects.length > 0) && (
        <div className="absolute top-12 left-0 w-[400px] bg-surface-1 border border-glass-border-hover rounded-xl shadow-2xl overflow-hidden z-50 animate-scale-in">
          
          {/* Scrolling Container */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            
            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 size={18} className="animate-spin text-(--color-brand)" />
              </div>
            )}

            {/* Default state / No Results */}
            {!loading && prospects.length === 0 && filteredFeatures.length === 0 && (
              <p className="text-xs text-center text-text-gray py-6">
                No results found for &quot;{query}&quot;
              </p>
            )}

            {/* Prospects Section */}
            {!loading && prospects.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-bold text-(--color-brand) uppercase tracking-wider px-3 mb-2">
                  Prospects & Clients
                </p>
                {prospects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleRoute(`/admin/prospects/${p.id}`)}
                    className="w-full flex flex-col text-left px-3 py-2.5 rounded-lg hover:bg-surface-3 transition-colors mb-1 group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium text-white group-hover:text-(--color-brand) transition-colors">
                        {p.name}
                      </span>
                      <ArrowRight size={14} className="text-text-gray opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {(p.company || p.email) && (
                      <span className="text-xs text-text-muted truncate flex gap-2">
                        {p.company && <span>{p.company}</span>}
                        {p.company && p.email && <span>·</span>}
                        {p.email && <span>{p.email}</span>}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Features Section */}
            {!loading && filteredFeatures.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider px-3 mb-2 mt-2">
                  System Navigation
                </p>
                {filteredFeatures.map((f) => (
                  <button
                    key={f.href}
                    onClick={() => handleRoute(f.href)}
                    className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-lg hover:bg-surface-3 transition-colors mb-1 group"
                  >
                    <span className="text-sm font-medium text-white group-hover:text-amber-500 transition-colors">
                      {f.label}
                    </span>
                    <ArrowRight size={14} className="text-text-gray opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Agency OS — Vertical Template Definitions
// ============================================
// Config-driven industry CRM templates.
// Each vertical customizes terminology, pipeline stages,
// sidebar items, and dashboard widgets — NOT the data model.
// ============================================

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Building2, Users, GitBranch, Mail, MailOpen,
  Ticket, CreditCard, Zap, Inbox, Settings,
  Hammer, ShoppingBag, Scissors, Dumbbell, Home, Camera, Store, ClipboardList,
  CalendarDays, FileText, Package, Heart, Briefcase, ListOrdered, BarChart3,
} from "lucide-react";

// ── Types ──────────────────────────────────────────

export type VerticalId =
  | "general"
  | "contractor"
  | "food"
  | "beauty"
  | "fitness"
  | "realestate"
  | "creative"
  | "retail";

export type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type PipelineStage = {
  id: string;
  label: string;
  color: string;
  probability: number;
};

export type Terminology = {
  prospect: string;       // singular: "Lead", "Client", "Member", etc.
  prospects: string;      // plural
  pipeline: string;       // "Jobs", "Orders", "Appointments"
  ticket: string;         // "Work Order", "Support Request", "Client Note"
  tickets: string;        // plural
  email: string;          // "Communications", "Email", "Messages"
  addProspect: string;    // CTA: "Add Lead", "Add Client", etc.
  emptyProspect: string;  // Empty state: "No leads yet", etc.
};

export type VerticalConfig = {
  id: VerticalId;
  name: string;
  icon: LucideIcon;
  emoji: string;
  description: string;
  terminology: Terminology;
  pipelineStages: PipelineStage[];
  sidebarItems: SidebarItem[];
};

// ── Helper to build sidebar items with common structure ──

function buildSidebar(overrides: Partial<Record<string, { label: string; icon: LucideIcon }>>): SidebarItem[] {
  const base: SidebarItem[] = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "My Clients", href: "/admin/clients", icon: Building2 },
    { label: overrides.prospects?.label || "Prospects", href: "/admin/prospects", icon: overrides.prospects?.icon || Users },
    { label: overrides.pipeline?.label || "Pipeline", href: "/admin/pipeline", icon: overrides.pipeline?.icon || GitBranch },
    { label: overrides.email?.label || "Email", href: "/admin/email", icon: overrides.email?.icon || Mail },
    { label: "Email History", href: "/admin/email/history", icon: MailOpen },
    { label: "Email Sequences", href: "/admin/email/sequences", icon: ListOrdered },
    { label: overrides.tickets?.label || "Tickets", href: "/admin/tickets", icon: overrides.tickets?.icon || Ticket },
    { label: "Billing", href: "/admin/billing", icon: CreditCard },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    { label: "Price Book", href: "/admin/pricebook", icon: ShoppingBag },
    { label: "Automations", href: "/admin/automations", icon: Zap },
    { label: "Inbox", href: "/admin/inbox", icon: Inbox },
    { label: "Calendar", href: "/admin/calendar", icon: ShoppingBag }, // Re-using an icon temporarily
    { label: "Business Rules", href: "/admin/settings/business", icon: Settings },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];
  return base;
}

// ── Vertical Definitions ──────────────────────────────────

const VERTICALS: Record<VerticalId, VerticalConfig> = {

  // ── 1. General (Default) ──────────────────────────
  general: {
    id: "general",
    name: "General",
    icon: ClipboardList,
    emoji: "📋",
    description: "Standard CRM for any business type",
    terminology: {
      prospect: "Prospect",
      prospects: "Prospects",
      pipeline: "Pipeline",
      ticket: "Ticket",
      tickets: "Tickets",
      email: "Email",
      addProspect: "Add Prospect",
      emptyProspect: "No prospects yet. Add your first prospect to get started.",
    },
    pipelineStages: [
      { id: "lead", label: "New Lead", color: "#3b82f6", probability: 0.1 },
      { id: "contacted", label: "Contacted", color: "#3b82f6", probability: 0.25 },
      { id: "proposal", label: "Proposal Sent", color: "#f59e0b", probability: 0.5 },
      { id: "dev", label: "In Development", color: "#10b981", probability: 0.8 },
      { id: "launched", label: "Launched", color: "#06d6a0", probability: 1.0 },
    ],
    sidebarItems: buildSidebar({}),
  },

  // ── 2. Contractor ──────────────────────────
  contractor: {
    id: "contractor",
    name: "Contractor",
    icon: Hammer,
    emoji: "🏗️",
    description: "Roofing, plumbing, HVAC, electrical, landscaping",
    terminology: {
      prospect: "Lead",
      prospects: "Leads",
      pipeline: "Jobs",
      ticket: "Work Order",
      tickets: "Work Orders",
      email: "Communications",
      addProspect: "Add Lead",
      emptyProspect: "No leads yet. Add your first lead to start building your pipeline.",
    },
    pipelineStages: [
      { id: "lead", label: "New Lead", color: "#3b82f6", probability: 0.1 },
      { id: "contacted", label: "Estimate Sent", color: "#3b82f6", probability: 0.25 },
      { id: "proposal", label: "Approved", color: "#f59e0b", probability: 0.5 },
      { id: "dev", label: "In Progress", color: "#10b981", probability: 0.8 },
      { id: "launched", label: "Complete", color: "#06d6a0", probability: 1.0 },
    ],
    sidebarItems: buildSidebar({
      prospects: { label: "Leads", icon: Users },
      pipeline: { label: "Jobs", icon: Briefcase },
      email: { label: "Communications", icon: Mail },
      tickets: { label: "Work Orders", icon: ClipboardList },
    }),
  },

  // ── 3. Food & Beverage ──────────────────────────
  food: {
    id: "food",
    name: "Food & Beverage",
    icon: ShoppingBag,
    emoji: "🍰",
    description: "Bakery, restaurant, café, food truck, catering",
    terminology: {
      prospect: "Customer",
      prospects: "Customers",
      pipeline: "Orders",
      ticket: "Support Request",
      tickets: "Support",
      email: "Messages",
      addProspect: "Add Customer",
      emptyProspect: "No customers yet. Add your first customer to start tracking orders.",
    },
    pipelineStages: [
      { id: "lead", label: "New Order", color: "#3b82f6", probability: 0.1 },
      { id: "contacted", label: "Confirmed", color: "#3b82f6", probability: 0.3 },
      { id: "proposal", label: "In Prep", color: "#f59e0b", probability: 0.6 },
      { id: "dev", label: "Ready", color: "#10b981", probability: 0.9 },
      { id: "launched", label: "Completed", color: "#06d6a0", probability: 1.0 },
    ],
    sidebarItems: buildSidebar({
      prospects: { label: "Customers", icon: Users },
      pipeline: { label: "Orders", icon: Package },
      tickets: { label: "Support", icon: Ticket },
      email: { label: "Messages", icon: Mail },
    }),
  },

  // ── 4. Beauty & Wellness ──────────────────────────
  beauty: {
    id: "beauty",
    name: "Beauty & Wellness",
    icon: Scissors,
    emoji: "💇",
    description: "Salon, spa, barbershop, nail salon, massage",
    terminology: {
      prospect: "Client",
      prospects: "Clients",
      pipeline: "Appointments",
      ticket: "Client Note",
      tickets: "Client Notes",
      email: "Messages",
      addProspect: "Add Client",
      emptyProspect: "No clients yet. Add your first client to start managing appointments.",
    },
    pipelineStages: [
      { id: "lead", label: "Inquiry", color: "#3b82f6", probability: 0.1 },
      { id: "contacted", label: "Booked", color: "#3b82f6", probability: 0.4 },
      { id: "proposal", label: "Checked In", color: "#f59e0b", probability: 0.7 },
      { id: "dev", label: "In Service", color: "#10b981", probability: 0.9 },
      { id: "launched", label: "Completed", color: "#06d6a0", probability: 1.0 },
    ],
    sidebarItems: buildSidebar({
      prospects: { label: "Clients", icon: Users },
      pipeline: { label: "Appointments", icon: CalendarDays },
      tickets: { label: "Client Notes", icon: Heart },
      email: { label: "Messages", icon: Mail },
    }),
  },

  // ── 5. Health & Fitness ──────────────────────────
  fitness: {
    id: "fitness",
    name: "Health & Fitness",
    icon: Dumbbell,
    emoji: "🏥",
    description: "Gym, yoga studio, personal trainer, martial arts",
    terminology: {
      prospect: "Member",
      prospects: "Members",
      pipeline: "Memberships",
      ticket: "Support Request",
      tickets: "Support",
      email: "Communications",
      addProspect: "Add Member",
      emptyProspect: "No members yet. Add your first member to start tracking memberships.",
    },
    pipelineStages: [
      { id: "lead", label: "Trial", color: "#3b82f6", probability: 0.15 },
      { id: "contacted", label: "Signed Up", color: "#3b82f6", probability: 0.4 },
      { id: "proposal", label: "Active", color: "#10b981", probability: 0.8 },
      { id: "dev", label: "Paused", color: "#f59e0b", probability: 0.3 },
      { id: "launched", label: "Cancelled", color: "#64748b", probability: 0.0 },
    ],
    sidebarItems: buildSidebar({
      prospects: { label: "Members", icon: Users },
      pipeline: { label: "Memberships", icon: CreditCard },
      tickets: { label: "Support", icon: Ticket },
      email: { label: "Communications", icon: Mail },
    }),
  },

  // ── 6. Real Estate ──────────────────────────
  realestate: {
    id: "realestate",
    name: "Real Estate",
    icon: Home,
    emoji: "🏠",
    description: "Realtor, property manager, home inspector, mortgage broker",
    terminology: {
      prospect: "Lead",
      prospects: "Leads",
      pipeline: "Deals",
      ticket: "Request",
      tickets: "Requests",
      email: "Communications",
      addProspect: "Add Lead",
      emptyProspect: "No leads yet. Add your first lead to start tracking deals.",
    },
    pipelineStages: [
      { id: "lead", label: "New Lead", color: "#3b82f6", probability: 0.1 },
      { id: "contacted", label: "Showing", color: "#3b82f6", probability: 0.25 },
      { id: "proposal", label: "Offer Made", color: "#f59e0b", probability: 0.5 },
      { id: "dev", label: "Under Contract", color: "#10b981", probability: 0.8 },
      { id: "launched", label: "Closed", color: "#06d6a0", probability: 1.0 },
    ],
    sidebarItems: buildSidebar({
      prospects: { label: "Leads", icon: Users },
      pipeline: { label: "Deals", icon: FileText },
      tickets: { label: "Requests", icon: Ticket },
      email: { label: "Communications", icon: Mail },
    }),
  },

  // ── 7. Creative & Professional Services ──────────────────────────
  creative: {
    id: "creative",
    name: "Creative & Professional",
    icon: Camera,
    emoji: "🎯",
    description: "Photographer, consultant, accountant, lawyer, marketing agency",
    terminology: {
      prospect: "Client",
      prospects: "Clients",
      pipeline: "Projects",
      ticket: "Support Ticket",
      tickets: "Support Tickets",
      email: "Email",
      addProspect: "Add Client",
      emptyProspect: "No clients yet. Add your first client to start managing projects.",
    },
    pipelineStages: [
      { id: "lead", label: "Inquiry", color: "#3b82f6", probability: 0.1 },
      { id: "contacted", label: "Discovery", color: "#3b82f6", probability: 0.25 },
      { id: "proposal", label: "Proposal", color: "#f59e0b", probability: 0.5 },
      { id: "dev", label: "Active Project", color: "#10b981", probability: 0.8 },
      { id: "launched", label: "Delivered", color: "#06d6a0", probability: 1.0 },
    ],
    sidebarItems: buildSidebar({
      prospects: { label: "Clients", icon: Users },
      pipeline: { label: "Projects", icon: Briefcase },
      tickets: { label: "Support Tickets", icon: Ticket },
    }),
  },

  // ── 8. Retail ──────────────────────────
  retail: {
    id: "retail",
    name: "Retail",
    icon: Store,
    emoji: "🏪",
    description: "Boutique, gift shop, pet store, florist, bookstore",
    terminology: {
      prospect: "Customer",
      prospects: "Customers",
      pipeline: "Orders",
      ticket: "Support Request",
      tickets: "Support",
      email: "Messages",
      addProspect: "Add Customer",
      emptyProspect: "No customers yet. Add your first customer to start tracking orders.",
    },
    pipelineStages: [
      { id: "lead", label: "New Order", color: "#3b82f6", probability: 0.1 },
      { id: "contacted", label: "Processing", color: "#3b82f6", probability: 0.3 },
      { id: "proposal", label: "Shipped", color: "#f59e0b", probability: 0.7 },
      { id: "dev", label: "Delivered", color: "#10b981", probability: 0.95 },
      { id: "launched", label: "Completed", color: "#06d6a0", probability: 1.0 },
    ],
    sidebarItems: buildSidebar({
      prospects: { label: "Customers", icon: Users },
      pipeline: { label: "Orders", icon: Package },
      tickets: { label: "Support", icon: Ticket },
      email: { label: "Messages", icon: Mail },
    }),
  },
};

// ── Public API ──────────────────────────────────

export function getVerticalConfig(id: VerticalId | string | undefined): VerticalConfig {
  return VERTICALS[(id as VerticalId) || "general"] || VERTICALS.general;
}

export function getAllVerticals(): VerticalConfig[] {
  return Object.values(VERTICALS);
}

export function getVerticalIds(): VerticalId[] {
  return Object.keys(VERTICALS) as VerticalId[];
}

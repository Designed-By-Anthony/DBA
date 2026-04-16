// ============================================
// Agency OS — Central Type Definitions
// ============================================

// ---- SaaS Multi-Tenancy ----

export type UserRole = 'owner' | 'admin' | 'member';

export interface BusinessSettings {
  depositPolicy: 'full' | 'percentage' | 'flat';
  depositAmount: number; // if flat, cents. if percentage, 0-100.
  cancellationWindowHours: number;
  requireDigitalWaiver: boolean;
  enableOnlineOrdering: boolean;
  inventoryMode: 'standard' | 'strict'; // strict auto-86s items
}

export interface Agency {
  id: string; // The unique agencyId
  name: string;
  domain: string; // e.g., 'designedbyanthony.com'
  ownerId: string; // The User ID of the owner
  createdAt: string;
  maxUsers: number;
  settings?: BusinessSettings; // Optional for backwards compatibility
}

export interface UserAuth {
  name: string;
  agencyId: string; // The tenant this user belongs to
  role: UserRole;
  createdAt: string;
  
  // Hierarchical Family Accounts (Fitness & Boutiques)
  familyRole?: 'account_manager' | 'dependent' | 'peer';
  managedByUserId?: string; // If dependent, points to the account_manager
  legalWaiverSignedAt?: string; // High-liability check for physical kiosks
}

// ---- Prospect / CRM ----

export interface Prospect {
  id: string;
  agencyId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  targetUrl: string;
  status: ProspectStatus;
  dealValue: number;
  source: string;
  tags: string[];
  notes: string;
  assignedTo: string;
  createdAt: string;
  lastContactedAt: string | null;
  unsubscribed: boolean;

  // Phase 1+: Expanded fields
  calendlyEventUrl?: string | null;
  auditReportUrl?: string | null;
  contractDocUrl?: string | null;
  driveFolderUrl?: string | null;
  stripeCustomerId?: string | null;
  portalUserId?: string | null;
  onboarding?: OnboardingChecklist;
  pricingTier?: PricingTier | null;
  customPricing?: CustomPricing | null;

  // Portal / client-visible fields
  projectNotes?: string | null;       // Client-visible status update from admin
  contractSigned?: boolean;            // Admin marks contract as signed
  contractStatus?: 'draft' | 'sent' | 'signed';
  fcmToken?: string | null;            // FCM push notification token
  stagingUrl?: string | null;          // URL for the Web Viewer staging site

  // Intelligent CRM Features
  leadScore?: number;                  // AI/Heuristic calculated score (0-100)
  healthStatus?: ProspectHealthStatus; // Anti-churn indicator

  /** Lowercased email for duplicate detection (optional on legacy rows) */
  emailNormalized?: string;
}

export type ProspectHealthStatus = 'healthy' | 'at_risk' | 'churn_risk';


export type ProspectStatus =
  | 'lead'
  | 'contacted'
  | 'proposal'
  | 'dev'
  | 'launched';

/** Follow-up task / reminder on a prospect (subcollection `crm_tasks`) */
export interface CrmTask {
  id: string;
  prospectId: string;
  agencyId: string;
  title: string;
  dueAt: string;
  completed: boolean;
  createdAt: string;
}

// ---- Activity Timeline ----

export interface Activity {
  id: string;
  agencyId: string;
  prospectId: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type ActivityType =
  | 'form_submission'    // Filled out contact/audit form on the site
  | 'audit_completed'    // Lighthouse audit was generated
  | 'email_sent'         // You sent them an email
  | 'email_opened'       // They opened an email
  | 'email_clicked'      // They clicked a link in an email
  | 'call_booked'        // Calendly booking created
  | 'call_completed'     // Meeting happened
  | 'note_added'         // You manually added a note
  | 'status_changed'     // Pipeline stage changed
  | 'contract_sent'      // Google Doc contract shared
  | 'contract_signed'    // Client signed the contract
  | 'payment_received'   // Stripe payment came in
  | 'file_uploaded'      // Client uploaded to Drive
  | 'ticket_created'     // Support ticket submitted
  | 'ticket_replied'     // Admin replied to a ticket
  | 'milestone_shared';  // Preview link sent to client

// ---- Pricing & Billing ----

export type PricingTier = string; // Dynamically maps to Stripe Product IDs

export interface PricingTierConfig {
  id: PricingTier;
  name: string;
  price: number; // To be deprecated
  interval: 'month' | 'year';
  description: string;
  features: string[];
  stripePriceId?: string; // Standardized
}

export interface CustomPricing {
  buildFeeCents: number;         // Total build cost in cents
  downPaymentCents: number;      // Due on signing in cents
  completionPaymentCents: number; // Due before going live in cents
  retainerTier: PricingTier;     // Stripe Product ID
  crmTier?: 'free' | 'advanced'; 
  notes?: string;
  
  // Legacy fields (Safe fallback during DB migration)
  buildFee?: number;
  downPayment?: number;
  completionPayment?: number;
}

export type QuoteTier = 'standard' | 'good' | 'better' | 'best';

export interface QuoteItem {
  stripeProductId: string;
  name: string;
  priceCents: number;
  type: 'recurring' | 'one_time';
  interval?: 'month' | 'year'; // If recurring
}

export interface QuotePackage {
  id: string; // usually maps to QuoteTier
  tier: QuoteTier;
  title: string;
  description?: string;
  items: QuoteItem[];
  totalOneTimeCents: number;
  totalRecurringCents: number;
}

export interface Quote {
  id: string;
  agencyId: string;
  prospectId: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined';
  packages: QuotePackage[];
  selectedPackageId?: string; // Set when accepted
  signatureDataUrl?: string; // Captured HTML canvas sig
  signedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface BookingEvent {
  id: string;
  agencyId: string;
  prospectId: string; // The client booking the slot
  serviceId: string; // Stripe Product ID
  serviceName: string;
  startTime: string; // ISO DateTime
  endTime: string; // ISO DateTime
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  stripePaymentIntentId?: string; // Authorized deposit hold
  depositAmountCents: number;
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  agencyId: string;
  prospectId: string;
  prospectName: string;
  type: 'down_payment' | 'completion' | 'retainer';
  amount: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  stripePaymentIntentId?: string | null;
  stripeInvoiceId?: string | null;
  stripePaymentUrl?: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
}

// ---- Onboarding ----

export interface OnboardingChecklist {
  contractSigned: boolean;
  downPaymentReceived: boolean;
  logoUploaded: boolean;
  photosUploaded: boolean;
  serviceDescriptions: boolean;
  domainAccess: boolean;
  completionPaid?: boolean;
}

// ---- Support Tickets ----

export interface SupportTicket {
  id: string;
  agencyId: string;
  prospectId: string;
  prospectName: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  messages: TicketMessage[];
  createdAt: string;
  resolvedAt: string | null;
  /** Set when the first admin reply is recorded */
  firstResponseAt?: string | null;
}

export interface TicketMessage {
  id: string;
  from: 'client' | 'admin';
  content: string;
  createdAt: string;
}

// ---- Email ----

export interface EmailRecord {
  id: string;
  agencyId: string;
  prospectId: string;
  prospectEmail: string;
  prospectName: string;
  subject: string;
  bodyHtml: string;
  status: EmailStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  resendId: string | null;
  opens: number;
  clicks: ClickEvent[];
  createdAt: string;
}

export type EmailStatus = 'draft' | 'scheduled' | 'sent' | 'failed';

export interface ClickEvent {
  url: string;
  clickedAt: string;
  userAgent: string;
}

// ---- Dashboard ----

export interface DashboardStats {
  totalProspects: number;
  prospectsByStatus: Record<ProspectStatus, number>;
  emailsSent: number;
  emailsScheduled: number;
  totalOpens: number;
  totalClicks: number;
  pipelineValue: number;
  monthlyRecurringRevenue?: number;
  outstandingInvoices?: number;
  
  // Intelligent Analytics
  pipelineVelocityDays?: number; // Average days from 'lead' to 'launched'
  /** @deprecated Prefer weightedPipelineValue — kept for charts that still reference the old name */
  forecastedMrr?: number;
  /** Sum of dealValue × stage probability for non-launched prospects */
  weightedPipelineValue?: number;
  /** Active prospects with no touch in 14+ days (excludes launched) */
  staleLeadCount?: number;
  /** Incomplete tasks past due (crm_tasks) */
  overdueOpenTasksCount?: number;
}

// ---- UI Config ----

export interface PipelineColumn {
  id: ProspectStatus;
  label: string;
  color: string;
  probability: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

// ---- Automations & Rules ----

export interface AutomationRule {
  id: string;
  agencyId: string;
  name: string;
  isActive: boolean;
  trigger: AutomationTrigger;
  action: AutomationAction;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type AutomationTrigger = 
  | 'prospect_status_changed' 
  | 'ticket_created' 
  | 'activity_added' 
  | 'form_submission';

export interface AutomationAction {
  type: 'send_email' | 'add_tag' | 'change_status' | 'create_activity';
  payload: Record<string, unknown>; // e.g. { templateId: '...', tag: 'VIP' }
}

// ---- Email sequences (drip) ----

export interface EmailSequenceStep {
  /** Hours after the previous send (first step: hours after enrollment) */
  delayHours: number;
  subject: string;
  bodyHtml: string;
}

export interface EmailSequenceDefinition {
  id: string;
  agencyId: string;
  name: string;
  isActive: boolean;
  steps: EmailSequenceStep[];
  createdAt: string;
  updatedAt?: string;
}

export type SequenceEnrollmentStatus = 'active' | 'completed' | 'cancelled';

export interface SequenceEnrollment {
  id: string;
  agencyId: string;
  prospectId: string;
  sequenceId: string;
  stepIndex: number;
  nextRunAt: string;
  status: SequenceEnrollmentStatus;
  enrolledAt: string;
}



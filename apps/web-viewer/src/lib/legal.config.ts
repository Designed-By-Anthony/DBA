/**
 * Legal Configuration — Central source of truth for legal entity details.
 * Used by TOS, Privacy Policy, AUP, and CAN-SPAM compliance.
 */
export const legalConfig = {
  entityName: "Designed By Anthony",
  entityType: "Sole Proprietorship",
  jurisdiction: "New York",
  contactEmail: "anthony@designedbyanthony.com",
  privacyEmail: "anthony@designedbyanthony.com",
  physicalAddress: "Mohawk Valley, New York",
  website: "https://designedbyanthony.com",
  platformName: "Agency OS",
  effectiveDate: "2026-04-19",
  lastUpdated: "2026-04-19",
} as const;

"use client";

import { legalConfig } from "@/lib/legal.config";

export default function AcceptableUsePolicyPage() {
  const c = legalConfig;

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 text-[var(--color-text-secondary)]">
      <h1 className="text-3xl font-bold text-white mb-2">Acceptable Use Policy</h1>
      <p className="text-sm mb-8 text-[var(--color-text-muted)]">
        Effective Date: {c.effectiveDate} &middot; Last Updated: {c.lastUpdated}
      </p>

      <section className="space-y-6 leading-relaxed text-sm">
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Purpose</h2>
          <p>
            This Acceptable Use Policy (&ldquo;AUP&rdquo;) governs your use of {c.platformName}
            operated by {c.entityName}. This AUP supplements our Terms of Service.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Prohibited Activities</h2>
          <p>You may not use {c.platformName} to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Send unsolicited bulk email (spam) or violate CAN-SPAM, GDPR, or CASL</li>
            <li>Harvest or scrape email addresses, phone numbers, or other personal data</li>
            <li>Upload or transmit malicious software, viruses, or exploits</li>
            <li>Impersonate another person, business, or entity</li>
            <li>Store, process, or transmit protected health information (PHI) without a signed Business Associate Agreement (BAA)</li>
            <li>Process payments for illegal goods or services</li>
            <li>Attempt to access data belonging to other tenants</li>
            <li>Use automated tools to overload, stress-test, or attack the platform</li>
            <li>Resell or sublicense platform access without written authorization</li>
            <li>Store or distribute content depicting child exploitation or abuse</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Email Usage</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>All emails must include a valid unsubscribe mechanism</li>
            <li>Email lists must be opt-in — purchased lists are prohibited</li>
            <li>Bounce rates exceeding 5% may result in temporary email suspension</li>
            <li>You must maintain a valid physical mailing address in all marketing emails</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Data Handling</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>You are responsible for the data you upload and must comply with applicable data protection laws</li>
            <li>Credit card numbers must not be stored in CRM notes, custom fields, or file attachments — use the integrated Stripe payment processing</li>
            <li>Social Security Numbers, driver&apos;s license numbers, and financial account numbers must not be stored in free-text fields</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">API & Integration Usage</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>API rate limits must be respected (documented per endpoint)</li>
            <li>Webhook endpoints must respond within 30 seconds</li>
            <li>Integration credentials must be stored securely and never shared publicly</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Enforcement</h2>
          <p>
            Violations may result in: written warning, temporary feature restriction,
            account suspension, or permanent termination at our sole discretion.
            We will attempt to notify you before taking action, except in cases of
            imminent harm or legal obligation.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Reporting Violations</h2>
          <p>
            If you believe someone is violating this AUP, report it to{" "}
            <a href={`mailto:${c.contactEmail}`} className="text-[var(--color-brand)] hover:underline">
              {c.contactEmail}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

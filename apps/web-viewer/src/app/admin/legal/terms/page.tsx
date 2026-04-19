"use client";

import { legalConfig } from "@/lib/legal.config";

export default function TermsOfServicePage() {
  const c = legalConfig;

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 text-[var(--color-text-secondary)]">
      <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
      <p className="text-sm mb-8 text-[var(--color-text-muted)]">
        Effective Date: {c.effectiveDate} &middot; Last Updated: {c.lastUpdated}
      </p>

      <section className="space-y-6 leading-relaxed text-sm">
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using {c.platformName} (the &ldquo;Platform&rdquo;), operated by{" "}
            <strong className="text-white">{c.entityName}</strong> (&ldquo;we,&rdquo; &ldquo;us,&rdquo;
            or &ldquo;our&rdquo;), you agree to be bound by these Terms of Service
            (&ldquo;Terms&rdquo;). If you do not agree, do not use the Platform.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">2. Description of Service</h2>
          <p>
            {c.platformName} is a multi-tenant SaaS customer relationship management (CRM) platform
            that provides business management tools including but not limited to: lead management,
            point-of-sale, inventory tracking, appointment scheduling, email communications,
            invoicing, and client portal functionality.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">3. Account Registration</h2>
          <p>
            You must provide accurate, current, and complete information during registration.
            You are responsible for safeguarding your account credentials and for all activities
            under your account. You must notify us immediately of any unauthorized use.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">4. Multi-Tenant Data Isolation</h2>
          <p>
            Each organization (&ldquo;Tenant&rdquo;) operates in an isolated data environment.
            Your data is scoped exclusively to your organization and is not accessible by other
            tenants. We implement row-level security and tenant-scoped access controls.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Use the Platform for any unlawful purpose or in violation of any applicable law</li>
            <li>Attempt to gain unauthorized access to other tenants&apos; data</li>
            <li>Transmit malware, viruses, or any code of a destructive nature</li>
            <li>Send unsolicited commercial communications (spam) through the Platform</li>
            <li>Impersonate any person or entity, or misrepresent your affiliation</li>
            <li>Interfere with or disrupt the integrity or performance of the Platform</li>
            <li>Use the email features in violation of CAN-SPAM, GDPR, or CASL regulations</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">6. Intellectual Property</h2>
          <p>
            The Platform, including its source code, design, logos, and documentation, is owned by{" "}
            {c.entityName} and is protected by copyright, trademark, and other intellectual property
            laws. You retain ownership of your data and content uploaded to the Platform.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">7. Payment Terms</h2>
          <p>
            Certain features require a paid subscription. Payments are processed through Stripe.
            Subscription fees are non-refundable except as required by law. We reserve the right
            to change pricing with 30 days&apos; written notice.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">8. Data Retention & Deletion</h2>
          <p>
            You may export or delete your data at any time. Upon account termination, we will
            retain your data for 30 days, after which it will be permanently deleted from our
            systems and backups.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">9. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, {c.entityName.toUpperCase()} SHALL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
            OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR
            ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">10. Disclaimer of Warranties</h2>
          <p>
            THE PLATFORM IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
            WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
            IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless {c.entityName}, its officers, directors,
            employees, and agents from any claims, damages, losses, liabilities, and expenses
            arising from your use of the Platform or violation of these Terms.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">12. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice, for
            conduct that we believe violates these Terms or is harmful to other users, us,
            or third parties, or for any other reason at our sole discretion.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">13. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the
            State of {c.jurisdiction}, without regard to its conflict of law provisions.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">14. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Material changes will be
            communicated via email or in-app notification at least 30 days before they take effect.
            Continued use after changes constitutes acceptance.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">15. Contact</h2>
          <p>
            Questions about these Terms? Contact us at{" "}
            <a href={`mailto:${c.contactEmail}`} className="text-[var(--color-brand)] hover:underline">
              {c.contactEmail}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

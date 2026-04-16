import { test, expect } from '@playwright/test';

/** Align with LEAD_WEBHOOK_SECRET in .env.test / theme.config default */
const leadSecret = () => process.env.LEAD_WEBHOOK_SECRET || 'dba-lead-hook-2026';

test.describe('External Integrations Webhook Parity', () => {

  test('Lighthouse Audit POST successfully normalizes keys and generates a valid Prospect', async ({ request }) => {
    const payload = {
      email: `test_audit_integration_${Date.now()}@example.com`,
      name: 'Integration Tester',
      company: 'Test Corp Audit',
      websiteUrl: 'https://example.com',
      source: 'audit',
      auditReportUrl: 'https://lighthouse.designedbyanthony.com/report/DBA-123',
      trustScore: 85,
      performanceScore: 92,
    };

    const response = await request.post('/api/webhooks/lead', {
      data: payload,
      headers: {
        'x-lead-secret': leadSecret(),
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.prospectId).toBeDefined();

    // In a real test running against the emulator, you could optionally natively fetch it:
    // const doc = await db.collection('prospects').doc(result.prospectId).get();
    // expect(doc.data().auditReportUrl).toBe('https://lighthouse.designedbyanthony.com/report/DBA-123');
  });

  test('Astro Contact Form POST successfully normalizes keys and generates a valid Prospect', async ({ request }) => {
    const payload = {
      email: `test_contact_integration_${Date.now()}@example.com`,
      name: 'Contact Form Tester',
      company: 'Contact Corp',
      websiteUrl: 'https://contact-test.com',
      source: 'contact',
      projectRequirements: 'We need a robust multi-tenant SaaS application built on Next.js',
      phone: '555-555-5555',
    };

    const response = await request.post('/api/webhooks/lead', {
      data: payload,
      headers: {
        'x-lead-secret': leadSecret(),
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.prospectId).toBeDefined();
  });
});

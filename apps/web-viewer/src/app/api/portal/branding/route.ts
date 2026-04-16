import { NextRequest, NextResponse } from 'next/server';
import type { PlanSuite } from '@dba/lead-form-contract';
import { db } from '@/lib/firebase';

/**
 * Portal Branding API
 * 
 * GET /api/portal/branding?org=orgId
 * 
 * Returns the branding settings for a given org.
 * This is a public endpoint (no auth) since the portal login page needs it.
 */
export async function GET(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get('org');

  if (!orgId) {
    return NextResponse.json({
      brandName: 'Client Portal',
      brandColor: '#2563eb',
      brandInitial: 'D',
      verticalTemplate: 'general',
      planSuite: 'full' satisfies PlanSuite,
    });
  }

  try {
    const doc = await db.collection('org_settings').doc(orgId).get();

    if (!doc.exists) {
      return NextResponse.json({
        brandName: 'Client Portal',
        brandColor: '#2563eb',
        brandInitial: 'D',
        verticalTemplate: 'general',
        planSuite: 'full' satisfies PlanSuite,
      });
    }

    const data = doc.data()!;
    const rawPlan = data.planSuite;
    const planSuite: PlanSuite = rawPlan === 'starter' ? 'starter' : 'full';

    return NextResponse.json({
      brandName: data.brandName || 'Client Portal',
      brandColor: data.brandColor || '#2563eb',
      brandInitial: data.brandInitial || 'D',
      verticalTemplate: data.verticalTemplate || 'general',
      planSuite,
    });
  } catch (error) {
    console.error('Portal branding error:', error);
    return NextResponse.json({
      brandName: 'Client Portal',
      brandColor: '#2563eb',
      brandInitial: 'D',
      verticalTemplate: 'general',
      planSuite: 'full' satisfies PlanSuite,
    });
  }
}

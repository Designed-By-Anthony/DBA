-- Enable Row Level Security on all tenant-bound tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Tenants table policy: Can see the tenant if current_tenant_id matches, or if bypass is on
CREATE POLICY tenant_isolation_policy ON tenants
  FOR ALL
  USING (
    clerk_org_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'on'
  );

-- All other tables policy: Can see rows if tenant_id matches, or if bypass is on
DO $$ 
DECLARE 
  t text;
  tables text[] := ARRAY['leads', 'activities', 'emails', 'email_sequences', 'sequence_enrollments', 'automations', 'tasks', 'tickets', 'notifications', 'push_subscriptions', 'portal_tokens', 'portal_sessions', 'sites'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('
      CREATE POLICY tenant_isolation_policy ON %I
      FOR ALL
      USING (
        tenant_id = current_setting(''app.current_tenant_id'', true)
        OR current_setting(''app.bypass_rls'', true) = ''on''
      )
    ', t);
  END LOOP;
END $$;

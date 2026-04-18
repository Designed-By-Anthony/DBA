const fs = require('fs');

let content = fs.readFileSync('apps/web-viewer/src/lib/email-sequence-processor.ts', 'utf8');

content = content.replace('setTenantContext,', 'withTenantContext,\n  withBypassRls,');

content = content.replace(/const dueEnrollments = await db[\s\S]*?\.limit\(100\);/g, `const dueEnrollments = await withBypassRls(db, async (tx) => {
      return tx
        .select()
        .from(sequenceEnrollments)
        .where(
          and(
            eq(sequenceEnrollments.status, "active"),
            lte(sequenceEnrollments.nextRunAt, now),
          ),
        )
        .limit(100);
    });`);

content = content.replace(/await setTenantContext\(db, enrollment\.tenantId\);([\s\S]*?)(?=      \} catch \(err\))/g, function(match, innerContent) {
  let replacedInner = innerContent.replace(/\bdb\./g, 'tx.');
  return `await withTenantContext(db, enrollment.tenantId, async (tx) => {${replacedInner}      });\n`;
});

fs.writeFileSync('apps/web-viewer/src/lib/email-sequence-processor.ts', content);
console.log('Done email-sequence-processor');

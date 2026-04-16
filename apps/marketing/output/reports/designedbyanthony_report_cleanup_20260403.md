# Designed by Anthony Report Cleanup

Export reviewed from `designedbyanthony.com_mega_export_20260403.csv`.

## Snapshot

- Raw rows in export: `45`
- Canonical flagged rows after cleanup: `19`
- High-priority items: `1`
- Medium-priority items: `13`
- Low-priority monitor items: `3`
- Ignore / system-noise items: `2`

## Fix First

- `https://www.designedbyanthony.com/`: `5xx errors | No HSTS support`
- `https://designedbyanthony.com/blog`: `Low text to HTML ratio | Structured data that contains markup errors`
- `https://designedbyanthony.com/blog/astro-vs-wix`: `Content not optimized | Title element is too long`
- `https://designedbyanthony.com/blog/fix-thin-content`: `Content not optimized | Title element is too long`
- `https://designedbyanthony.com/blog/mobile-first-seo`: `Title element is too long`
- `https://designedbyanthony.com/blog/seasonal-business-seo`: `Content not optimized | Title element is too long`
- `https://designedbyanthony.com`: `Structured data that contains markup errors`
- `https://designedbyanthony.com/privacy`: `Broken internal links`
- `https://designedbyanthony.com/service-areas/columbus`: `Pages with only one internal link`
- `https://designedbyanthony.com/service-areas/miami`: `Pages with only one internal link`
- `https://designedbyanthony.com/service-areas`: `Low text to HTML ratio | Structured data that contains markup errors`
- `https://designedbyanthony.com/services`: `Low text to HTML ratio | Structured data that contains markup errors`
- `https://designedbyanthony.com/ouredge`: `Structured data that contains markup errors`
- `https://designedbyanthony.com/portfolio`: `Low text to HTML ratio | Structured data that contains markup errors`

## Monitor Later

- `https://designedbyanthony.com/cookie`: `Low text to HTML ratio`
- `https://designedbyanthony.com/image-license`: `Low text to HTML ratio | Low word count`
- `https://designedbyanthony.com/contact`: `Low text to HTML ratio`

## Ignore or Recheck

- `https://designedbyanthony.com/sitemap-0.xml`: `Orphaned sitemap pages`
- `https://designedbyanthony.com/cdn-cgi/l/email-protection`: `4xx errors`

## Notes

- The root URL and root-with-trailing-slash rows were consolidated into one homepage record.
- `Low text to HTML ratio` was treated as low-signal unless it appeared alongside a stronger issue.
- The `cdn-cgi/l/email-protection` row was treated as a system path, not a normal marketing page.
- The `www` hostname issue was manually verified and is a real infrastructure problem worth fixing.
- The cleaned CSV is the sortable action sheet: `output/reports/designedbyanthony_report_cleanup_20260403.csv`.


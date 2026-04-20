# VertaFlow CRM — Embeddable Lead Form

A self-contained lead capture form that works on **any** website. Drop the HTML snippet into Wix, Duda, WordPress, Squarespace, or any site builder — leads flow directly into your VertaFlow CRM dashboard.

## Quick Start

1. Copy the contents of `lead-form.html`
2. Paste it into an **HTML embed block** on your website
3. Update the `CRM_ENDPOINT` variable in the `<script>` block to point to your CRM:
   ```js
   var CRM_ENDPOINT = 'https://admin.designedbyanthony.com/api/lead';
   ```
4. Done. Leads appear in your CRM.

## Themes

### Dark mode (default)
The form ships in dark mode, matching the VertaFlow brand.

### Light mode
Add the class `vf-light` to switch to a light theme:
```html
<div id="vf-lead-form" class="vf-light" data-vertaflow-form="lead-capture">
```

### Custom colors
Override CSS variables at the top of the `<style>` block:
```css
#vf-lead-form {
  --vf-brand: #your-brand-color;
  --vf-bg: #your-background;
  --vf-surface: #your-input-background;
}
```

## Data sent to CRM

Each submission POSTs the following JSON to your endpoint:

| Field | Type | Description |
|---|---|---|
| `name` | string | Contact's full name |
| `email` | string | Contact's email |
| `phone` | string | Phone number (optional) |
| `company` | string | Business name |
| `service` | string | Selected service type |
| `message` | string | Free-text message |
| `source` | string | Hostname of the embedding site |
| `referrer` | string | HTTP referrer URL |
| `webDesignInterest` | boolean | Checked the DBA cross-promo |
| `type` | string | Always `lead_form_embed` |
| `formVersion` | string | `1.0.0` |

## Platform compatibility

| Platform | Method |
|---|---|
| **Wix** | Add → Embed → Custom HTML |
| **Duda** | Widget → HTML |
| **WordPress** | Custom HTML block |
| **Squarespace** | Code Block |
| **Shopify** | Custom Liquid section |
| **Webflow** | Embed component |
| **Static HTML** | Paste directly |

## Attribution

The form includes a "Powered by VertaFlow CRM" footer link. This is part of the free tier; paid plans can remove it.

---

Built by [Designed by Anthony](https://designedbyanthony.com)

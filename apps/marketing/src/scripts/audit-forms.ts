import { buildPublicLeadPayloadFromFormData } from '@dba/lead-form-contract';
import { pushAnalyticsEvent, requestGaClientId } from './analytics';

/** Default `POST /api/lead` on Agency OS; override with `PUBLIC_CRM_LEAD_URL` at build time. */
const DEFAULT_FORM_ENDPOINT = 'https://viewer.designedbyanthony.com/api/lead';

export interface AuditFormError {
  field?: string;
  message?: string;
}

export interface AuditFormResponse {
  errors?: AuditFormError[];
  ok?: boolean;
}

export function resetAuditFormState(form: HTMLFormElement, { force = false } = {}): void {
  const successPanel = form.querySelector<HTMLElement>('[data-form-success]');
  const shell = form.querySelector<HTMLElement>('[data-form-shell]');
  const actions = form.querySelector<HTMLElement>('[data-form-actions]');
  const errorBox = form.querySelector<HTMLElement>('[data-form-error]');
  const submitButton = form.querySelector<HTMLButtonElement>('[data-form-submit]');
  const succeeded = form.dataset.formSucceeded === 'true';

  if (!force && !succeeded) return;

  form.reset();
  form.dataset.formSucceeded = 'false';

  shell?.removeAttribute('hidden');
  actions?.removeAttribute('hidden');
  errorBox?.setAttribute('hidden', '');
  if (errorBox) errorBox.textContent = '';
  successPanel?.setAttribute('hidden', '');

  form.querySelectorAll<HTMLElement>('[data-field-error]').forEach((element) => {
    element.textContent = '';
  });

  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((field) => {
    field.removeAttribute('aria-invalid');
  });

  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = submitButton.dataset.defaultLabel || submitButton.textContent || '';
  }

  setAuditHiddenField(form, 'source_page', window.location.pathname);
  setAuditHiddenField(form, 'page_url', window.location.href);
  setAuditHiddenField(form, 'referrer_url', document.referrer || 'direct');
  setAuditHiddenField(form, 'page_title', document.title);

  void syncGaClientId(form);

  // Reset the Turnstile widget so it's ready for re-submission
  const turnstileEl = form.querySelector<HTMLElement>('.cf-turnstile');
  if (turnstileEl && typeof (window as any).turnstile !== 'undefined') {
    (window as any).turnstile.reset(turnstileEl);
  }
}

function clearAuditFormErrors(form: HTMLFormElement): void {
  const errorBox = form.querySelector<HTMLElement>('[data-form-error]');

  form.querySelectorAll<HTMLElement>('[data-field-error]').forEach((element) => {
    element.textContent = '';
  });

  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((field) => {
    field.removeAttribute('aria-invalid');
  });

  if (errorBox) {
    errorBox.textContent = '';
    errorBox.setAttribute('hidden', '');
  }
}

function setAuditFieldError(form: HTMLFormElement, fieldName: string, message: string): void {
  const field = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${fieldName}"]`);
  const errorSlot = form.querySelector<HTMLElement>(`[data-field-error="${fieldName}"]`);

  field?.setAttribute('aria-invalid', 'true');
  if (errorSlot) {
    errorSlot.textContent = message;
  }
}

function showAuditFormError(form: HTMLFormElement, message: string): void {
  const errorBox = form.querySelector<HTMLElement>('[data-form-error]');

  if (!errorBox) return;

  errorBox.textContent = message;
  errorBox.removeAttribute('hidden');
}

function restoreAuditSubmitButton(submitButton: HTMLButtonElement | null, defaultLabel: string): void {
  if (!submitButton) return;

  submitButton.disabled = false;
  submitButton.textContent = defaultLabel;
}

function setAuditHiddenField(form: HTMLFormElement, name: string, value: string): void {
  const field = form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!field) return;
  field.value = value;
}

async function syncGaClientId(form: HTMLFormElement): Promise<void> {
  const clientId = await requestGaClientId();
  if (!clientId) return;
  setAuditHiddenField(form, 'ga_client_id', clientId);
}

function trackAuditFormStart(form: HTMLFormElement): void {
  if (form.dataset.formStarted === 'true') return;

  form.dataset.formStarted = 'true';

  const pageContext = form.querySelector<HTMLInputElement>('input[name="page_context"]')?.value || 'unknown';
  const ctaSource = form.querySelector<HTMLInputElement>('input[name="cta_source"]')?.value || 'unknown';
  const leadSource = form.querySelector<HTMLInputElement>('input[name="lead_source"]')?.value;
  const pageTitle = form.querySelector<HTMLInputElement>('input[name="page_title"]')?.value || document.title;
  const pageUrl = form.querySelector<HTMLInputElement>('input[name="page_url"]')?.value || window.location.href;

  pushAnalyticsEvent('audit_form_start', {
    cta_source: ctaSource,
    source_page: window.location.pathname,
    page_context: pageContext,
    page_title: pageTitle,
    page_url: pageUrl,
    ...(leadSource ? { lead_source: leadSource } : {}),
  });

  if (pageContext === 'facebook_offer_landing') {
    pushAnalyticsEvent('facebook_offer_form_start', {
      cta_source: ctaSource,
      source_page: window.location.pathname,
      offer_type: form.querySelector<HTMLInputElement>('input[name="offer_type"]')?.value || 'unknown',
    });
  }
}

function handleAuditSuccess(form: HTMLFormElement): void {
  const successMode = form.dataset.successMode || 'inline';
  const pageContext = form.querySelector<HTMLInputElement>('input[name="page_context"]')?.value || 'unknown';
  const ctaSource = form.querySelector<HTMLInputElement>('input[name="cta_source"]')?.value || 'unknown';
  const offerType = form.querySelector<HTMLInputElement>('input[name="offer_type"]')?.value || 'unknown';
  const leadSource = form.querySelector<HTMLInputElement>('input[name="lead_source"]')?.value;
  const pageTitle = form.querySelector<HTMLInputElement>('input[name="page_title"]')?.value || document.title;
  const gaClientId = form.querySelector<HTMLInputElement>('input[name="ga_client_id"]')?.value || undefined;
  const pageUrl = form.querySelector<HTMLInputElement>('input[name="page_url"]')?.value || window.location.href;

  pushAnalyticsEvent('audit_form_submit', {
    cta_source: ctaSource,
    source_page: window.location.pathname,
    page_context: pageContext,
    page_title: pageTitle,
    page_url: pageUrl,
    ga_client_id: gaClientId,
    ...(leadSource ? { lead_source: leadSource } : {}),
  });

  pushAnalyticsEvent('generate_lead', {
    cta_source: ctaSource,
    source_page: window.location.pathname,
    page_context: pageContext,
    lead_type: offerType,
    form_name: 'audit_form',
    page_title: pageTitle,
    page_url: pageUrl,
    ga_client_id: gaClientId,
    ...(leadSource ? { lead_source: leadSource } : {}),
  });

  if (pageContext === 'facebook_offer_landing') {
    pushAnalyticsEvent('facebook_offer_submit', {
      cta_source: ctaSource,
      source_page: window.location.pathname,
      offer_type: offerType,
      form_endpoint: form.getAttribute('action') || DEFAULT_FORM_ENDPOINT,
    });
  }

  const submitButton = form.querySelector<HTMLButtonElement>('[data-form-submit]');
  if (submitButton) {
    submitButton.textContent = 'Request Received!';
    submitButton.classList.add('audit-submit-success');
    submitButton.disabled = true;
  }

  if (successMode === 'redirect') {
    const redirectTarget = form.dataset.successRedirect || '/thank-you?offer=audit';
    setTimeout(() => window.location.assign(redirectTarget), 1200);
    return;
  }

  const shell = form.querySelector<HTMLElement>('[data-form-shell]');
  const actions = form.querySelector<HTMLElement>('[data-form-actions]');
  const successPanel = form.querySelector<HTMLElement>('[data-form-success]');

  setTimeout(() => {
    shell?.setAttribute('hidden', '');
    actions?.setAttribute('hidden', '');
    successPanel?.removeAttribute('hidden');
    form.dataset.formSucceeded = 'true';
  }, 1200);
}

export function initFacebookOfferTracking(): void {
  if (!document.body.classList.contains('facebook-offer-page')) return;

  const focusFacebookOfferForm = () => {
    window.setTimeout(() => {
      const firstField = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        '#claim-offer input:not([type="hidden"]):not([tabindex="-1"]), #claim-offer textarea',
      );

      firstField?.focus({ preventScroll: true });
    }, 220);
  };

  pushAnalyticsEvent('facebook_offer_view', {
    source_page: window.location.pathname,
    page_context: 'facebook_offer_landing',
    page_url: window.location.href,
    referrer_url: document.referrer || 'direct',
  });

  const ctas = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-facebook-offer-cta]'));
  ctas.forEach((cta) => {
    cta.addEventListener('click', () => {
      pushAnalyticsEvent('facebook_offer_cta_click', {
        source_page: window.location.pathname,
        cta_source: cta.dataset.facebookOfferCta || 'unknown',
        cta_label: (cta.textContent || '').trim(),
        cta_target: cta.getAttribute('href') || 'unknown',
      });

      if (cta.getAttribute('href') === '#claim-offer') {
        focusFacebookOfferForm();
      }
    });
  });

  if (window.location.hash === '#claim-offer') {
    focusFacebookOfferForm();
  }
}

async function submitAuditForm(form: HTMLFormElement): Promise<void> {
  const submitButton = form.querySelector<HTMLButtonElement>('[data-form-submit]');
  const defaultLabel = submitButton?.textContent?.trim() || 'Send My Audit Request';
  const endpoint = form.getAttribute('action')?.trim() || DEFAULT_FORM_ENDPOINT;

  if (submitButton) {
    submitButton.dataset.defaultLabel = defaultLabel;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
  }

  clearAuditFormErrors(form);
  await syncGaClientId(form);

  // Validate Turnstile token before sending
  const turnstileInput = form.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]');
  if (!turnstileInput || !turnstileInput.value) {
    showAuditFormError(form, 'Please complete the security check.');
    restoreAuditSubmitButton(submitButton, defaultLabel);
    return;
  }

  const formData = new FormData(form);
  formData.set('source_page', window.location.pathname);
  formData.set('page_url', window.location.href);
  formData.set('referrer_url', document.referrer || 'direct');
  formData.set('page_title', document.title);

  const payload = buildPublicLeadPayloadFromFormData(formData);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as AuditFormResponse & { error?: string };

    if (!response.ok) {
      const errMsg =
        (typeof data.error === 'string' && data.error) ||
        (Array.isArray(data.errors) && data.errors[0]?.message) ||
        '';

      if (Array.isArray(data.errors) && data.errors.length > 0) {
        data.errors.forEach((error) => {
          if (error.field && error.message) {
            setAuditFieldError(form, error.field, error.message);
          }
        });

        if (data.errors.every((error) => !error.field)) {
          showAuditFormError(form, errMsg || 'Something went wrong. Please try again.');
        }
      } else {
        showAuditFormError(
          form,
          errMsg || 'Something went wrong while sending your request. Please try again.',
        );
      }

      restoreAuditSubmitButton(submitButton, defaultLabel);
      return;
    }

    handleAuditSuccess(form);
  } catch {
    showAuditFormError(form, 'We could not submit the form right now. Please try again in a moment.');
    restoreAuditSubmitButton(submitButton, defaultLabel);
  } finally {
    // Reset Turnstile widget for potential re-submission
    const turnstileEl = form.querySelector<HTMLElement>('.cf-turnstile');
    if (turnstileEl && typeof (window as any).turnstile !== 'undefined') {
      (window as any).turnstile.reset(turnstileEl);
    }
  }
}

function setAuditTrackingFields(form: HTMLFormElement): void {
  setAuditHiddenField(form, 'source_page', window.location.pathname);
  setAuditHiddenField(form, 'page_url', window.location.href);
  setAuditHiddenField(form, 'referrer_url', document.referrer || 'direct');
  setAuditHiddenField(form, 'page_title', document.title);
  void syncGaClientId(form);
}

export function initAuditForms(): { resetAllSuccessStates: (container?: ParentNode) => void } {
  const forms = Array.from(document.querySelectorAll<HTMLFormElement>('[data-audit-form]'));

  forms.forEach((form) => {
    setAuditTrackingFields(form);

    const startHandler = (event: Event) => {
      const target = event.target;
      if (
        !(target instanceof HTMLInputElement) &&
        !(target instanceof HTMLTextAreaElement) &&
        !(target instanceof HTMLSelectElement)
      ) {
        return;
      }

      if (target.type === 'hidden') return;
      trackAuditFormStart(form);
    };

    form.addEventListener('focusin', startHandler);
    form.addEventListener('input', startHandler);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void submitAuditForm(form);
    });
  });

  return {
    resetAllSuccessStates: (container?: ParentNode) => {
      const scope = container ?? document;
      scope.querySelectorAll<HTMLFormElement>('[data-audit-form]').forEach((form) => {
        resetAuditFormState(form);
      });
    },
  };
}

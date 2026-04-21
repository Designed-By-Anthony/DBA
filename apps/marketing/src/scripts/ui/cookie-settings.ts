/** Re-open the cookie banner (clears stored choice). Wired from [data-cookie-settings]. */
export function initCookieSettingsLinks(): void {
	document
		.querySelectorAll<HTMLElement>("[data-cookie-settings]")
		.forEach((el) => {
			if (el.dataset.cookieSettingsBound === "true") return;
			el.dataset.cookieSettingsBound = "true";
			el.addEventListener("click", (event) => {
				event.preventDefault();
				const open = (
					window as unknown as { __dbaOpenCookieConsent?: () => void }
				).__dbaOpenCookieConsent;
				if (typeof open === "function") open();
			});
		});
}

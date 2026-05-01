import {
	FACEBOOK_PRIVATE_OFFER_COPY,
	PRIVATE_FACEBOOK_LABEL,
} from "@/lib/offers";

export const staticMarketingPageCopy: Record<
	string,
	{ title: string; description: string; paragraphs: string[] }
> = {
	about: {
		title: "About ANTHONY.",
		description:
			"Marine Corps veteran–led Mohawk Valley web design studio for service businesses across Central New York.",
		paragraphs: [
			"Anthony builds custom websites, local SEO programs, managed hosting, and website rescues for contractors, home-service pros, medspas, salons, and other small businesses across Utica, Rome, Syracuse, and greater CNY.",
			"You work directly with the person writing the code — no bait-and-switch account team, no offshore ticket queue.",
		],
	},
	contact: {
		title: "Contact",
		description: "Reach ANTHONY. — secure form, no spam.",
		paragraphs: [
			"Tell us what you are trying to fix (slow site, Map Pack visibility, rescue rebuild, or net-new build). We reply within one business day with a clear next step.",
		],
	},
	pricing: {
		title: "Pricing",
		description:
			"Easy payments at launch, three months of hosting + SEO included, then optional Growth Plan.",
		paragraphs: [
			"Standard rebuilds are usually three equal payments at launch instead of one big number, with the first three months of hosting and core local SEO bundled. Book a short intro call for a written estimate tailored to your pages and integrations.",
		],
	},
	portfolio: {
		title: "Portfolio",
		description: "Selected builds and concept work from ANTHONY.",
		paragraphs: [
			"Below is a mix of live client work and published concept builds that show the layout, performance, and conversion patterns we ship.",
		],
	},
	faq: {
		title: "FAQ",
		description: "Quick answers before you spend a dollar.",
		paragraphs: [
			"For the full FAQ list, start on the homepage — or send a note through the contact form and we will point you to the right section.",
		],
	},
	ouredge: {
		title: "Our Edge",
		description:
			"Why our sites feel different — performance, structure, and long-term maintainability.",
		paragraphs: [
			"We build lean, fast marketing sites with modern tooling so you are not fighting plugins, template drift, or mystery bloat six months after launch.",
		],
	},
	"service-areas": {
		title: "Service Areas",
		description: "Mohawk Valley, Central NY, and select national markets.",
		paragraphs: [
			"Primary work is anchored in Rome, NY, with regular coverage across Utica, Syracuse, and the broader Mohawk Valley. We also support select remote clients (for example Houston and Naples) on a case-by-case basis.",
			"Each city and region below links to its own guide — local web design, SEO, and what to expect when you work with the studio from that market.",
		],
	},
	privacy: {
		title: "Privacy Policy",
		description:
			"How ANTHONY. handles information submitted through this site.",
		paragraphs: [
			"This policy describes what we collect through contact and audit forms, how long we retain it, and how to request deletion. A full legal review copy can be expanded here; for now, treat submissions as operational email + CRM records used only to respond and deliver services.",
		],
	},
	terms: {
		title: "Terms of Service",
		description:
			"Terms governing use of this website and engagement with ANTHONY.",
		paragraphs: [
			"Use of this site does not create a client relationship until a written agreement is signed. Project scope, payment milestones, and deliverables are defined per engagement.",
		],
	},
	cookie: {
		title: "Cookie Policy",
		description: "Cookies, analytics, and consent on designedbyanthony.com.",
		paragraphs: [
			"We use first-party and vendor cookies only where needed for security, measurement (for example GA4 after consent), and chat when enabled. Use the cookie banner to accept or reject non-essential analytics.",
		],
	},
	"image-license": {
		title: "Image License",
		description:
			"Attribution and licensing for imagery used on this marketing site.",
		paragraphs: [
			"Self-hosted marketing imagery includes Unsplash-sourced assets used under the Unsplash License unless otherwise noted. Client project screenshots are used with permission.",
		],
	},
	"thank-you": {
		title: "Thank you",
		description: "Your submission was received.",
		paragraphs: [
			"Anthony reviews every inbound note personally. If you asked for an audit or a consult, you will hear back within one business day with a clear next step.",
		],
	},
	"facebook-offer": {
		title: PRIVATE_FACEBOOK_LABEL,
		description: FACEBOOK_PRIVATE_OFFER_COPY,
		paragraphs: [
			"This page is for invited Facebook traffic only. If you landed here from an ad or direct message, you are in the right place — book a short strategy call using the link below and mention the private offer so we can confirm eligibility.",
		],
	},
	"404": {
		title: "Page not found",
		description: "That URL is not on this site (or it moved).",
		paragraphs: [
			"Try the homepage, the services index, or contact Anthony if you followed an old bookmark.",
		],
	},
};

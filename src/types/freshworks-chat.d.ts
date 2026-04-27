/** Freshworks Web Chat / Messenger globals (fw-cdn.com embed). */
declare global {
	interface Window {
		fcSettings?: {
			onInit?: () => void;
		};
		fcWidget?: {
			setExternalId: (id: string) => void;
			user: {
				setFirstName: (name: string) => void;
				setEmail: (email: string) => void;
				setProperties: (props: Record<string, string>) => void;
			};
		};
	}
}

export {};

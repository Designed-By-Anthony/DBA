import { create } from "zustand";
import { buildPublicApiUrl } from "@/lib/publicApi";

type WaitlistStatus = "idle" | "submitting" | "success" | "error";

type ToolsStore = {
	waitlistName: string;
	waitlistEmail: string;
	waitlistStatus: WaitlistStatus;
	waitlistError: string | null;
	setWaitlistName: (name: string) => void;
	setWaitlistEmail: (email: string) => void;
	submitWaitlist: () => Promise<void>;
	reset: () => void;
};

export const useToolsStore = create<ToolsStore>((set, get) => ({
	waitlistName: "",
	waitlistEmail: "",
	waitlistStatus: "idle",
	waitlistError: null,

	setWaitlistName: (name) => set({ waitlistName: name }),
	setWaitlistEmail: (email) => set({ waitlistEmail: email }),

	submitWaitlist: async () => {
		const { waitlistEmail } = get();
		if (!waitlistEmail.includes("@")) {
			set({
				waitlistError: "Please enter a valid email address.",
				waitlistStatus: "error",
			});
			return;
		}
		set({ waitlistStatus: "submitting", waitlistError: null });
		try {
			await fetch(buildPublicApiUrl("/api/lead-email"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: get().waitlistName || "Tools Waitlist Signup",
					email: waitlistEmail,
					source: "tools-waitlist",
					message: "Signed up for the Tools store waitlist.",
				}),
			});
			set({ waitlistStatus: "success" });
		} catch {
			set({
				waitlistStatus: "error",
				waitlistError: "Something went wrong. Try again.",
			});
		}
	},

	reset: () =>
		set({
			waitlistName: "",
			waitlistEmail: "",
			waitlistStatus: "idle",
			waitlistError: null,
		}),
}));

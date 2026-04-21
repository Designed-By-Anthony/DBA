"use client";

import { useState } from "react";
import type { StripeProductDetail } from "@/app/admin/actions/stripe";
import { formatCents } from "@/lib/currency";

export default function BookingWidget({
	agencyId,
	services,
	depositPolicy,
	cancellationHours,
}: {
	agencyId: string;
	services: StripeProductDetail[];
	depositPolicy: { type: "percentage" | "flat" | "full"; amount: number };
	cancellationHours: number;
}) {
	const [selectedService, setSelectedService] =
		useState<StripeProductDetail | null>(null);
	const [selectedDate, setSelectedDate] = useState<string>("");
	const [selectedTime, setSelectedTime] = useState<string>("");
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);

	// Mock Calendar Availability
	const availableTimes = [
		"09:00 AM",
		"10:00 AM",
		"11:30 AM",
		"01:00 PM",
		"03:00 PM",
	];

	const calculateDeposit = (priceCents: number) => {
		if (depositPolicy.type === "full") return priceCents;
		if (depositPolicy.type === "percentage")
			return Math.round(priceCents * (depositPolicy.amount / 100));
		return depositPolicy.amount; // flat fee cents
	};

	const handleBookSlot = async () => {
		if (!selectedService || !selectedDate || !selectedTime || !email || !name) {
			return alert("Complete all fields.");
		}
		setLoading(true);

		const depositCents = calculateDeposit(
			selectedService.default_price?.unit_amount || 0,
		);

		try {
			const { createBookingDepositAction } = await import("./actions");
			const res = await createBookingDepositAction({
				agencyId,
				serviceId: selectedService.id,
				serviceName: selectedService.name,
				date: selectedDate,
				time: selectedTime,
				clientEmail: email,
				clientName: name,
				depositCents,
			});

			if (res.url) {
				window.location.href = res.url; // Jump to Stripe Vault/Checkout
			} else {
				alert(res.error || "Booking failure");
			}
		} catch (e) {
			console.error(e);
			alert("System error tracking deposit.");
		}
		setLoading(false);
	};

	return (
		<div className="bg-white dark:bg-[var(--color-surface-1)] border border-[var(--color-glass-border)] rounded-3xl overflow-hidden shadow-2xl">
			<div className="bg-[var(--color-brand)] p-6 text-center text-white">
				<h2 className="text-2xl font-bold">Book an Appointment</h2>
				<p className="opacity-80 text-sm mt-1">
					Select your service and reserve a time slot.
				</p>
			</div>

			<div className="p-6 md:p-8 space-y-8">
				{/* Step 1: Service */}
				<div>
					<h3 className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-3">
						1. Select Service
					</h3>
					<div className="grid gap-3">
						{services.map((s) => (
							<label
								key={s.id}
								className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer transition-colors ${
									selectedService?.id === s.id
										? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)] ring-1 ring-[var(--color-brand)]"
										: "border-[var(--color-glass-border)] hover:border-[var(--color-text-gray)]"
								}`}
							>
								<div className="flex items-center gap-3">
									<input
										type="radio"
										name="service"
										className="text-[var(--color-brand)] focus:ring-[var(--color-brand)]"
										checked={selectedService?.id === s.id}
										onChange={() => setSelectedService(s)}
									/>
									<span className="font-semibold">{s.name}</span>
								</div>
								<span className="font-mono">
									{formatCents(s.default_price?.unit_amount || 0)}
								</span>
							</label>
						))}
					</div>
				</div>

				{/* Step 2: Date & Time */}
				{selectedService && (
					<div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
						<h3 className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-3">
							2. Date & Time
						</h3>
						<div className="grid grid-cols-2 gap-4 mb-4">
							<input
								type="date"
								min={new Date().toISOString().split("T")[0]}
								value={selectedDate}
								onChange={(e) => setSelectedDate(e.target.value)}
								className="p-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface-2)] text-white"
							/>
							<select
								value={selectedTime}
								onChange={(e) => setSelectedTime(e.target.value)}
								className="p-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface-2)] text-white outline-none focus:border-[var(--color-brand)]"
							>
								<option value="">Time...</option>
								{availableTimes.map((t) => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
							</select>
						</div>
					</div>
				)}

				{/* Step 3: Details & Deposit */}
				{selectedService && selectedDate && selectedTime && (
					<div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
						<h3 className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-3">
							3. Your Info
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<input
								type="text"
								placeholder="Full Name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="w-full p-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface-2)] text-white outline-none focus:border-[var(--color-brand)]"
							/>
							<input
								type="email"
								placeholder="Email Address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full p-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface-2)] text-white outline-none focus:border-[var(--color-brand)]"
							/>
						</div>

						<div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-400 mt-4 leading-relaxed">
							<strong>Secure Hold & Cancellation Policy:</strong> To lock this
							slot, a hold of{" "}
							<strong>
								{formatCents(
									calculateDeposit(
										selectedService.default_price?.unit_amount || 0,
									),
								)}
							</strong>{" "}
							will be placed on your cardiovascular. This deposit is forfeit if
							you cancel within {cancellationHours} hours of {selectedDate} at{" "}
							{selectedTime}.
						</div>

						<button
							onClick={handleBookSlot}
							disabled={!name || !email || loading}
							className="w-full mt-4 py-4 rounded-xl font-bold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-all disabled:opacity-50 disabled:grayscale shadow-xl shadow-[var(--color-brand-subtle)]"
						>
							{loading
								? "Authorizing Secure Vault..."
								: "Reserve & Authorize Card"}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

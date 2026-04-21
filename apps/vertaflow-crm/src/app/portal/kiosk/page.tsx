"use client";

import { type MouseEvent, type TouchEvent, useRef, useState } from "react";

type KioskParticipant = { id: string; name: string; waiverSigned: boolean };

// Mock User checking in (would come from DB by phone number/id)
const mockUserTree = {
	accountManager: { id: "mgr_1", name: "Anthony Jones", waiverSigned: true },
	dependents: [
		{ id: "dep_1", name: "Liam Jones", waiverSigned: true },
		{ id: "dep_2", name: "Sophia Jones", waiverSigned: false }, // Needs waiver
	] satisfies KioskParticipant[],
};

export default function FacilityKiosk() {
	const [step, setStep] = useState<"scan" | "select" | "waiver" | "success">(
		"scan",
	);
	const [selectedUser, setSelectedUser] = useState<KioskParticipant | null>(
		null,
	);
	const [signature, setSignature] = useState("");
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const handleScan = () => {
		// Mocking finding the account manager
		setStep("select");
	};

	const selectParticipant = (user: KioskParticipant) => {
		setSelectedUser(user);
		if (!user.waiverSigned) {
			setStep("waiver");
		} else {
			setStep("success");
			setTimeout(() => resetKiosk(), 3000);
		}
	};

	const signWaiver = () => {
		if (!signature) return alert("Signature required.");
		// In real app, push signature securely to the UserAuth.legalWaiverSignedAt
		setStep("success");
		setTimeout(() => resetKiosk(), 3000);
	};

	const resetKiosk = () => {
		setStep("scan");
		setSelectedUser(null);
		setSignature("");
	};

	// Canvas Logic
	const [isDrawing, setIsDrawing] = useState(false);
	const startDrawing = (
		e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>,
	) => {
		setIsDrawing(true);
		const ctx = canvasRef.current?.getContext("2d");
		if (!ctx || !canvasRef.current) return;
		const rect = canvasRef.current.getBoundingClientRect();
		const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
		const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
		ctx.lineWidth = 3;
		ctx.lineCap = "round";
		ctx.strokeStyle = "#fff";
		ctx.beginPath();
		ctx.moveTo(x, y);
	};
	const draw = (
		e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>,
	) => {
		if (!isDrawing) return;
		const ctx = canvasRef.current?.getContext("2d");
		if (!ctx || !canvasRef.current) return;
		const rect = canvasRef.current.getBoundingClientRect();
		const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
		const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
		ctx.lineTo(x, y);
		ctx.stroke();
	};
	const stopDrawing = () => {
		setIsDrawing(false);
		if (canvasRef.current) setSignature(canvasRef.current.toDataURL());
	};

	return (
		<div className="h-screen w-full bg-(--color-surface-0) flex items-center justify-center p-6 select-none touch-none overflow-hidden">
			{step === "scan" && (
				<div className="text-center animate-in fade-in zoom-in w-full max-w-lg">
					<div className="w-32 h-32 bg-(--color-brand)/20 rounded-full flex items-center justify-center mx-auto mb-8 border-[6px] border-(--color-brand) shadow-[0_0_40px_var(--color-brand-subtle)]">
						<span className="text-4xl text-(--color-brand)">ID</span>
					</div>
					<h1 className="text-4xl font-black text-white mb-4 tracking-tight">
						Tap Band or Enter Phone
					</h1>
					<p className="text-text-muted text-lg mb-12">
						Designed by Anthony Athletics front desk automated check-in.
					</p>

					<button
						onClick={handleScan}
						className="w-full py-6 bg-surface-2 text-xl font-bold text-white rounded-2xl border border-glass-border shadow-xl active:scale-95 transition-transform hover:border-(--color-brand)"
					>
						Simulate Scan / Check In
					</button>
				</div>
			)}

			{step === "select" && (
				<div className="w-full max-w-2xl bg-surface-1 border border-glass-border rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8">
					<div className="flex justify-between items-center mb-8">
						<div>
							<h2 className="text-3xl font-bold text-white">
								Who is participating today?
							</h2>
							<p className="text-text-muted mt-1">
								Select the person attending class.
							</p>
						</div>
						<button
							onClick={resetKiosk}
							className="text-text-muted hover:text-white px-4 py-2 border border-glass-border rounded-lg"
						>
							Cancel
						</button>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<button
							onClick={() => selectParticipant(mockUserTree.accountManager)}
							className="p-6 bg-surface-2 border border-glass-border rounded-2xl text-left hover:border-(--color-brand) group shadow-lg active:scale-95 transition-all"
						>
							<span className="block text-[10px] uppercase font-bold text-text-muted mb-2">
								Account Manager
							</span>
							<span className="block text-xl font-bold text-white group-hover:text-(--color-brand)">
								{mockUserTree.accountManager.name}
							</span>
							{!mockUserTree.accountManager.waiverSigned && (
								<span className="mt-4 block text-xs text-red-400 font-bold bg-red-400/10 px-2 py-1 rounded w-fit uppercase">
									! Needs Waiver
								</span>
							)}
						</button>

						{mockUserTree.dependents.map((dep) => (
							<button
								key={dep.id}
								onClick={() => selectParticipant(dep)}
								className="p-6 bg-surface-2 border border-glass-border rounded-2xl text-left hover:border-(--color-brand) group shadow-lg active:scale-95 transition-all"
							>
								<span className="block text-[10px] uppercase font-bold text-text-muted mb-2">
									Dependent / Minor
								</span>
								<span className="block text-xl font-bold text-white group-hover:text-(--color-brand)">
									{dep.name}
								</span>
								{!dep.waiverSigned && (
									<span className="mt-4 text-xs text-red-400 font-bold bg-red-400/10 px-2 py-1 rounded w-fit uppercase flex gap-2 items-center">
										<span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />{" "}
										Stop: Signature Reqd
									</span>
								)}
							</button>
						))}
					</div>
				</div>
			)}

			{step === "waiver" && (
				<div className="w-full max-w-4xl bg-surface-1 border-2 border-red-500/50 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.1)] animate-in zoom-in-95">
					<div className="bg-red-500/10 p-6 flex items-center justify-between border-b border-red-500/20">
						<h2 className="text-xl font-bold text-red-400 uppercase tracking-widest flex items-center gap-3">
							<span className="text-3xl">⚠️</span> Mandatory Legal Action
							Required
						</h2>
						<button
							onClick={() => setStep("select")}
							className="text-red-400 hover:text-white px-4 py-2 border border-red-500/30 rounded-lg text-sm bg-(--color-surface-0)"
						>
							Back
						</button>
					</div>

					<div className="p-8 pb-4">
						<h3 className="text-2xl font-bold text-white mb-2">
							Liability Waiver for {selectedUser?.name}
						</h3>
						<p className="text-text-muted leading-relaxed h-[150px] overflow-y-auto pr-4 mb-6 text-sm border-b border-glass-border pb-4">
							I, the Account Manager, recognize that physical training involves
							inherent risks of injury. By signing below, I voluntarily assume
							all risks associated with participation for myself and/or my
							dependent ({selectedUser?.name}) at Designed by Anthony Athletics.
							I hereby waive and release the facility from any and all
							liability, claims, or causes of action arising from participation.
						</p>

						<div className="space-y-2">
							<div className="flex justify-between items-center px-1">
								<label className="text-sm font-bold text-white uppercase tracking-wider">
									Account Manager Signature
								</label>
								<button
									onClick={() => {
										canvasRef.current
											?.getContext("2d")
											?.clearRect(0, 0, 800, 250);
										setSignature("");
									}}
									className="text-xs text-text-muted hover:text-white"
								>
									Clear
								</button>
							</div>
							<div className="bg-(--color-surface-0) border-2 border-glass-border rounded-2xl w-full h-[250px] overflow-hidden cursor-crosshair">
								<canvas
									ref={canvasRef}
									width={800}
									height={250}
									className="w-full h-full"
									onMouseDown={startDrawing}
									onMouseMove={draw}
									onMouseUp={stopDrawing}
									onMouseLeave={stopDrawing}
									onTouchStart={startDrawing}
									onTouchMove={draw}
									onTouchEnd={stopDrawing}
								/>
							</div>
						</div>
					</div>

					<div className="p-6 bg-surface-2 border-t border-glass-border flex justify-end">
						<button
							onClick={signWaiver}
							disabled={!signature}
							className="px-8 py-4 bg-red-500 text-white font-black text-xl tracking-wider rounded-xl hover:bg-red-400 disabled:opacity-50 disabled:grayscale transition-all shadow-lg active:scale-95"
						>
							I Agree & Sign Document
						</button>
					</div>
				</div>
			)}

			{step === "success" && (
				<div className="text-center animate-in zoom-in fade-in duration-500">
					<div className="w-40 h-40 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_rgba(16,185,129,0.3)] border-4 border-emerald-400">
						<svg
							className="w-20 h-20 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={3}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<h1 className="text-5xl font-black text-white mb-4">Checked In</h1>
					<p className="text-(--color-brand) text-2xl font-bold tracking-widest uppercase">
						Have a great session, {selectedUser?.name}!
					</p>
				</div>
			)}
		</div>
	);
}

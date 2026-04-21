"use client";

import { useEffect, useState } from "react";
import type { StripeProductDetail } from "@/app/admin/actions/stripe";
import { formatCents } from "@/lib/currency";

export const dynamic = "force-static";

const MOCK_MENU: StripeProductDetail[] = [
	{
		id: "prod_1",
		name: "Artisan Burger",
		description: "Wagyu beef, truffle aioli, aged cheddar",
		active: true,
		metadata: {},
		default_price: {
			id: "price_mock_1",
			unit_amount: 1800,
			currency: "usd",
			recurring: null,
			type: "one_time",
		},
	},
	{
		id: "prod_2",
		name: "Truffle Fries",
		description: "Parmesan, herbs, truffle salt",
		active: true,
		metadata: {},
		default_price: {
			id: "price_mock_2",
			unit_amount: 800,
			currency: "usd",
			recurring: null,
			type: "one_time",
		},
	},
	{
		id: "prod_3",
		name: "Caesar Salad",
		description: "Romaine, house croutons",
		active: true,
		metadata: {},
		default_price: {
			id: "price_mock_3",
			unit_amount: 1200,
			currency: "usd",
			recurring: null,
			type: "one_time",
		},
	},
];

export default function OnlineOrderingPortal() {
	const [menuItems, setMenuItems] = useState<StripeProductDetail[]>([]);
	const [cart, setCart] = useState<
		{ id: string; product: StripeProductDetail; qty: number; mods: string[] }[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [selectedItemForMod, setSelectedItemForMod] =
		useState<StripeProductDetail | null>(null);
	const [currentMods, setCurrentMods] = useState<string>("");

	useEffect(() => {
		// Mock load from Stripe Price Book
		const t = setTimeout(() => {
			setMenuItems(MOCK_MENU);
			setLoading(false);
		}, 500);
		return () => clearTimeout(t);
	}, []);

	const openModModal = (product: StripeProductDetail) => {
		setSelectedItemForMod(product);
		setCurrentMods("");
	};

	const confirmAddToCart = () => {
		if (!selectedItemForMod) return;

		setCart((prev) => {
			const modsArray = currentMods
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
			return [
				...prev,
				{
					id: Math.random().toString(),
					product: selectedItemForMod,
					qty: 1,
					mods: modsArray,
				},
			];
		});
		setSelectedItemForMod(null);
	};

	const cartTotalCents = cart.reduce(
		(sum, item) =>
			sum + (item.product.default_price?.unit_amount || 0) * item.qty,
		0,
	);

	const handleCheckout = () => {
		if (cart.length === 0) return;
		alert(
			"This will direct to Stripe Checkout and automatically send the generated order instantly to the Expediter KDS, including your custom mods.",
		);
	};

	return (
		<div className="min-h-screen bg-(--color-surface-0) pb-32 relative">
			{/* Mod Modal */}
			{selectedItemForMod && (
				<div className="fixed inset-0 z-100 bg-black/60 flex items-center justify-center p-4">
					<div className="bg-surface-1 border border-glass-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
						<h2 className="text-xl font-bold text-white mb-1">
							{selectedItemForMod.name}
						</h2>
						<p className="text-text-muted text-sm mb-6">
							Customize your order.
						</p>

						<div className="space-y-4 mb-6">
							<label className="block text-sm font-medium text-text-gray">
								Special Instructions (Mods)
							</label>
							<input
								type="text"
								placeholder="e.g. No Cheese, Extra Ketchup"
								value={currentMods}
								onChange={(e) => setCurrentMods(e.target.value)}
								className="w-full bg-surface-2 border border-glass-border rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-(--color-brand)"
							/>
						</div>

						<div className="flex gap-3">
							<button
								onClick={() => setSelectedItemForMod(null)}
								className="flex-1 py-3 rounded-lg font-semibold text-white bg-surface-2 border border-glass-border hover:bg-surface-3"
							>
								Cancel
							</button>
							<button
								onClick={confirmAddToCart}
								className="flex-1 py-3 rounded-lg font-bold text-white bg-(--color-brand) hover:brightness-110"
							>
								Add to Cart
							</button>
						</div>
					</div>
				</div>
			)}
			{/* Header Image */}
			<div className="h-64 relative bg-surface-2">
				{/* Placeholder for Restaurant Hero Image */}
				<div className="absolute inset-0 bg-linear-to-t from-(--color-surface-0) to-transparent" />
				<div className="absolute bottom-0 left-0 w-full p-6 text-white max-w-5xl mx-auto">
					<h1 className="text-4xl font-bold mb-2">Designed by Anthony Cafe</h1>
					<p className="text-text-muted">Pickup ready in 15-20 minutes.</p>
				</div>
			</div>

			<div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
				{/* Menu Section */}
				<div className="flex-1 space-y-6">
					<h2 className="text-2xl font-bold text-white mb-6">Menu</h2>

					{loading ? (
						<div className="text-text-muted">
							Loading physical POS inventory...
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4">
							{menuItems.map((item) => (
								<div
									key={item.id}
									className="bg-surface-1 border border-glass-border rounded-2xl p-4 flex justify-between items-center hover:border-(--color-brand) transition-colors group cursor-pointer"
									onClick={() => openModModal(item)}
								>
									<div className="pr-4">
										<h3 className="text-lg font-bold text-white group-hover:text-(--color-brand) transition-colors">
											{item.name}
										</h3>
										<p className="text-sm text-text-muted line-clamp-2 mt-1">
											{item.description}
										</p>
										<p className="mt-3 font-mono font-bold text-white">
											{formatCents(item.default_price?.unit_amount || 0)}
										</p>
									</div>
									<div className="w-24 h-24 bg-surface-2 rounded-xl shrink-0 flex items-center justify-center border border-glass-border text-3xl font-black text-text-muted/20 shadow-inner overflow-hidden relative">
										{/* <Image src={...} /> */}
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Floating Cart (Mobile Bottom, Desktop Right) */}
				<div className="w-full md:w-[350px] fixed bottom-0 left-0 md:static bg-surface-1 md:bg-transparent border-t md:border-0 border-glass-border p-4 md:p-0 z-50">
					<div className="bg-surface-2 border border-glass-border rounded-2xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
						<h2 className="text-xl font-bold text-white mb-4 hidden md:block">
							Your Order
						</h2>

						<div className="flex-1 overflow-y-auto mb-4 space-y-4">
							{cart.length === 0 ? (
								<p className="text-text-muted text-sm text-center py-4">
									Add items from the menu to get started.
								</p>
							) : (
								cart.map((c) => (
									<div
										key={c.id}
										className="flex justify-between items-start text-sm border-b border-glass-border pb-2 last:border-0"
									>
										<div className="flex gap-2 flex-1">
											<span className="font-bold text-(--color-brand)">
												{c.qty}x
											</span>
											<div>
												<p className="text-white font-medium">
													{c.product.name}
												</p>
												{c.mods.length > 0 && (
													<ul className="text-xs text-text-muted mt-1 list-disc pl-3">
														{c.mods.map((mod) => (
															<li key={mod}>{mod}</li>
														))}
													</ul>
												)}
											</div>
										</div>
										<span className="text-white font-mono">
											{formatCents(
												(c.product.default_price?.unit_amount || 0) * c.qty,
											)}
										</span>
									</div>
								))
							)}
						</div>

						<div className="border-t border-glass-border pt-4 space-y-2">
							<div className="flex justify-between text-sm text-text-muted">
								<span>Subtotal</span>
								<span className="font-mono">{formatCents(cartTotalCents)}</span>
							</div>
							<div className="flex justify-between text-sm text-text-muted">
								<span>Taxes (8%)</span>
								<span className="font-mono">
									{formatCents(Math.round(cartTotalCents * 0.08))}
								</span>
							</div>
							<div className="flex justify-between text-lg font-bold text-white pt-2">
								<span>Total</span>
								<span className="font-mono">
									{formatCents(
										cartTotalCents + Math.round(cartTotalCents * 0.08),
									)}
								</span>
							</div>

							<button
								onClick={handleCheckout}
								disabled={cart.length === 0}
								className="w-full mt-4 py-4 rounded-xl font-bold text-white bg-(--color-brand) hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
							>
								Checkout & Send to Kitchen
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

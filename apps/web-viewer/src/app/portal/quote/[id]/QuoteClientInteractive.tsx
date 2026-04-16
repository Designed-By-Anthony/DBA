"use client";

import { useState, useRef } from "react";
import { formatCents } from "@/lib/currency";
import type { Quote, QuotePackage } from "@/lib/types";
import { acceptQuoteAndCheckoutAction } from "./actions";

export default function QuoteClientInteractive({ quote, companyName }: { quote: Quote; companyName: string }) {
  const [selectedPackage, setSelectedPackage] = useState<QuotePackage | null>(quote.packages.length === 1 ? quote.packages[0] : null);
  const [signature, setSignature] = useState(quote.signatureDataUrl || "");
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simple Canvas Signature Logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Setup context
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffffff';

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignature(canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature("");
  };

  const handleAccept = async () => {
    if (!selectedPackage) return alert("Please select a package first.");
    if (!signature) return alert("Please provide your signature to accept.");
    
    setLoading(true);
    try {
      const res = await acceptQuoteAndCheckoutAction({
        quoteId: quote.id,
        prospectId: quote.prospectId,
        packageId: selectedPackage.id,
        signatureDataUrl: signature
      });
      
      if (res.url) {
        window.location.href = res.url; // Redirect to Stripe Checkout
      } else {
        alert(res.error || "Failed to initiate checkout.");
      }
    } catch (e) {
      console.error(e);
      alert("System error processing acceptance.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Package Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">Select a Package</h2>
        <div className={`grid gap-6 ${quote.packages.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : 'grid-cols-1 md:grid-cols-3'}`}>
          {quote.packages.map(pkg => (
            <div 
              key={pkg.id} 
              onClick={() => setSelectedPackage(pkg)}
              className={`relative p-6 rounded-2xl border transition-all cursor-pointer ${
                selectedPackage?.id === pkg.id 
                  ? 'bg-[var(--color-surface-2)] border-[var(--color-brand)] shadow-lg shadow-[var(--color-brand-subtle)] ring-1 ring-[var(--color-brand)]' 
                  : 'bg-[var(--color-surface-1)] border-[var(--color-glass-border)] hover:border-[var(--color-text-gray)]'
              }`}
            >
              {selectedPackage?.id === pkg.id && (
                <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 bg-[var(--color-brand)] text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                  ✓
                </div>
              )}
              
              <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-1">{pkg.title}</h3>
              
              <div className="my-6 space-y-1">
                <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">Due Today</p>
                <p className="text-3xl font-bold text-white font-mono">{formatCents(pkg.totalOneTimeCents)}</p>
                
                {pkg.totalRecurringCents > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">Recurring</p>
                    <p className="text-xl font-semibold text-[var(--color-brand)] font-mono">{formatCents(pkg.totalRecurringCents)} / mo</p>
                  </div>
                )}
              </div>
              
              <ul className="space-y-3 pt-6 border-t border-[var(--color-glass-border)]">
                {pkg.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-[var(--color-text-gray)]">
                    <span className="text-[var(--color-brand)] mt-0.5">✦</span>
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {quote.status === 'accepted' ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-emerald-400 mb-2">Quote Accepted</h2>
          <p className="text-emerald-400/80">Thank you for your business. We look forward to working with you.</p>
        </div>
      ) : (
        <div className="bg-[var(--color-surface-1)] border border-[var(--color-glass-border)] rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6">Authorization & Signature</h2>
          <div className="prose prose-invert prose-sm max-w-none text-[var(--color-text-gray)] mb-6">
            <p>
              By signing below, {companyName} agrees to authorize the selected digital marketing packages and initiates the billing agreement for the initial down payment and any subsequent recurring software/service retainers. The terms outined in the Master Service Agreement will apply.
            </p>
          </div>
          
           <div className="space-y-3 max-w-md mx-auto">
             <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Your Signature</label>
                <button onClick={clearSignature} className="text-xs text-[var(--color-text-muted)] hover:text-white transition-colors">Clear</button>
             </div>
             <div className="bg-[var(--color-surface-2)] border border-[var(--color-glass-border)] rounded-xl overflow-hidden touch-none">
               <canvas
                 ref={canvasRef}
                 width={400}
                 height={150}
                 onMouseDown={startDrawing}
                 onMouseMove={draw}
                 onMouseUp={stopDrawing}
                 onMouseLeave={stopDrawing}
                 onTouchStart={startDrawing}
                 onTouchMove={draw}
                 onTouchEnd={stopDrawing}
                 className="w-full h-[150px] cursor-crosshair"
               />
             </div>
           </div>

           <div className="mt-8 flex justify-center">
             <button
               onClick={handleAccept}
               disabled={!selectedPackage || !signature || loading}
               className="w-full max-w-md py-4 rounded-xl font-bold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-all disabled:opacity-50 disabled:grayscale shadow-xl shadow-[var(--color-brand-subtle)]"
             >
               {loading ? 'Processing Secure Checkout...' : 'Accept & Process Payment'}
             </button>
           </div>
        </div>
      )}

    </div>
  );
}

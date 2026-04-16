export default function ProspectsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-6 w-32 bg-white/5 rounded" />
        <div className="h-10 w-36 bg-white/5 rounded-lg" />
      </div>
      <div className="h-10 w-full max-w-md bg-white/5 rounded-lg" />
      <div className="rounded-xl border border-[var(--color-glass-border)] overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b border-[var(--color-glass-border)]" style={{
            background: "linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)",
            backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
          }} />
        ))}
      </div>
    </div>
  );
}

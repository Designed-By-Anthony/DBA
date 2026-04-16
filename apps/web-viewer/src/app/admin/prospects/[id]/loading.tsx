export default function ProspectDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-4 bg-white/5 rounded" />
        <div className="w-12 h-12 rounded-full bg-white/5" />
        <div className="space-y-2">
          <div className="w-40 h-5 bg-white/5 rounded" />
          <div className="w-28 h-3 bg-white/5 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 h-64" />
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 h-16" />
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 h-48" />
        </div>
        {/* Right */}
        <div className="space-y-6">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 h-36" />
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 h-64" />
        </div>
      </div>
    </div>
  );
}

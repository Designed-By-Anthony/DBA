import Image from "next/image";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Branded loading indicator */}
      <div className="flex items-center gap-3 animate-fade-in">
        <div
          className="relative h-8 w-[108px] shrink-0 shadow-[0_4px_20px_rgb(59_130_246/0.22)]"
          style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
        >
          <Image
            src="/dba-mark.webp"
            alt=""
            width={108}
            height={32}
            className="h-8 w-auto object-contain object-left"
            priority
          />
        </div>
        <div>
          <div className="h-3 w-24 rounded skeleton mb-1.5" />
          <div className="h-2 w-16 rounded skeleton" />
        </div>
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`h-28 rounded-xl border border-glass-border skeleton animate-fade-up stagger-${i + 1}`}
          />
        ))}
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-3 animate-fade-up stagger-5">
        <div className="h-10 w-40 rounded-lg skeleton" />
        <div className="h-10 w-36 rounded-lg skeleton" />
        <div className="h-10 w-32 rounded-lg skeleton" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="h-72 rounded-xl border border-glass-border skeleton animate-fade-up stagger-5"
        />
        <div
          className="h-72 rounded-xl border border-glass-border skeleton animate-fade-up stagger-6"
        />
      </div>
    </div>
  );
}

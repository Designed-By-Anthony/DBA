import React from 'react';

interface ScoreRingProps {
  score: number;
  label: string;
}

export function ScoreRing({ score, label }: ScoreRingProps) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = "text-danger";
  if (score >= 90) colorClass = "text-success";
  else if (score >= 50) colorClass = "text-warning";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Background Ring */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-white/10"
          />
          {/* Progress Ring */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ease-out ${colorClass}`}
            strokeLinecap="round"
          />
        </svg>
        <div className={`absolute text-2xl font-display font-medium ${colorClass}`}>
          {score}
        </div>
      </div>
      <span className="text-sm font-medium text-slate-300 uppercase tracking-widest text-center">
        {label}
      </span>
    </div>
  );
}

"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

interface ScoreRingProps {
    score: number | null;
    label: string;
    size?: "md" | "lg";
}

export function ScoreRing({ score, label, size = "md" }: ScoreRingProps) {
    const [filled, setFilled] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (prefersReducedMotion) {
            setFilled(true);
            return;
        }
        const raf = requestAnimationFrame(() =>
            requestAnimationFrame(() => setFilled(true)),
        );
        return () => cancelAnimationFrame(raf);
    }, [prefersReducedMotion]);

    const isLg = size === "lg";
    const radius = isLg ? 46 : 36;
    const strokeWidth = isLg ? 6 : 5.5;
    const svgSize = isLg ? 104 : 80;
    const cx = svgSize / 2;
    const circumference = 2 * Math.PI * radius;

    const pct = score == null ? 0 : Math.min(100, Math.max(0, score));
    const targetOffset = circumference - (pct / 100) * circumference;
    const strokeDashoffset = filled ? targetOffset : circumference;

    // --- Trillion-Dollar Color Logic ---
    // Standard traffic lights for scores, but using the Bronze-RGB variable for the hover state
    let colorVar = "rgba(248,113,113,0.9)"; // Red
    let textColor = "#f87171";
    
    if (score == null) {
        colorVar = "rgba(255,255,255,0.15)";
        textColor = "rgba(255,255,255,0.3)";
    } else if (score >= 90) {
        colorVar = "rgba(74,222,128,0.95)"; // Green
        textColor = "#4ade80";
    } else if (score >= 50) {
        colorVar = "rgba(251,191,36,0.95)"; // Amber
        textColor = "#fbbf24";
    }

    const wrapSize = isLg ? "h-[104px] w-[104px]" : "h-[80px] w-[80px]";
    const scoreSize = isLg ? "text-[1.75rem]" : "text-[1.35rem]";
    const titleText =
        score == null ? `${label}: N/A` : `${label}: ${score}/100`;

    return (
        <figure
            className="flex flex-col items-center gap-2.5 transition-all duration-300 ease-out"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={titleText}
            style={{
                transform: isHovered ? "translateY(-4px)" : "translateY(0)",
            }}
        >
            <div className={`relative flex items-center justify-center ${wrapSize}`}>
                {/* Unified Bronze Halo on Hover */}
                {isHovered && (
                    <div 
                        className="absolute inset-0 rounded-full blur-2xl opacity-20"
                        style={{ background: 'rgb(var(--accent-bronze-rgb))' }}
                    />
                )}
                
                <svg
                    className="h-full w-full -rotate-90 transform"
                    viewBox={`0 0 ${svgSize} ${svgSize}`}
                    aria-hidden="true"
                    role="img"
                >
                    <title>{titleText}</title>
                    {/* Track - Standardized to a subtle white hairline */}
                    <circle
                        cx={cx}
                        cy={cx}
                        r={radius}
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Progress Ring */}
                    {score != null && (
                        <circle
                            cx={cx}
                            cy={cx}
                            r={radius}
                            stroke={colorVar}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            style={{
                                transition: filled
                                    ? "stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)"
                                    : "none",
                                // Fixed: Removing the CSS filters that cause the triangle strobe
                                // Using standard SVG stroke for clarity
                            }}
                        />
                    )}
                </svg>
                
                <span
                    className={`absolute font-[family-name:var(--font-display)] font-bold leading-none ${scoreSize}`}
                    style={{ 
                        color: textColor,
                        // Add a subtle bronze tint to the text glow on hover
                        textShadow: isHovered ? `0 0 15px ${colorVar}` : 'none'
                    }}
                    aria-hidden="true"
                >
                    {score == null ? "—" : score}
                </span>
            </div>
            <span className="text-center text-[9px] font-bold uppercase tracking-[0.25em] text-white/40">
                {label}
            </span>
        </figure>
    );
}
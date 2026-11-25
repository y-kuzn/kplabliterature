"use client";

import React, { useEffect, useState } from "react";

interface Props {
  stage?: "drafting" | "searching" | "comparing" | "idle";
  subtitle?: string;
  compact?: boolean;
}

const STAGE_STEPS: Record<NonNullable<Props["stage"]>, string[]> = {
  idle: [
    "Ready to draft Boolean queries & hunt across 6 scientific hubs",
  ],
  drafting: [
    "Translating your topic into MeSH & Boolean syntax...",
    "Tuning OpenAlex, Semantic Scholar & Protocol queries...",
    "Preparing editable query plan for your review...",
  ],
  searching: [
    "Scanning PubMed, Semantic Scholar, OpenAlex & bioRxiv...",
    "Checking RCSB PDB 3D structures, Addgene & PhD theses...",
    "Resolving Open Access PDFs & PubPeer integrity audits...",
  ],
  comparing: [
    "Extracting constructs, resolutions (Å) & Kd metrics...",
    "Checking physiological buffer & pH caveats...",
    "Assembling your comparative biophysical matrix...",
  ],
};

export default function ScienceCatLoader({ stage = "searching", subtitle, compact = false }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const messages = STAGE_STEPS[stage];

  useEffect(() => {
    setStepIdx(0);
    if (messages.length <= 1) return;
    const id = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % messages.length);
    }, 2200);
    return () => clearInterval(id);
  }, [stage, messages.length]);

  return (
    <div className={compact ? "flex flex-col items-center justify-center text-center" : "py-10 px-4 flex flex-col items-center justify-center text-center space-y-4"}>
      {/* Animated Science Cat SVG */}
      <div className={compact ? "relative w-24 h-20 select-none" : "relative w-36 h-32 select-none"}>
        <style jsx>{`
          @keyframes catBob {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
          }
          @keyframes tailWag {
            0%, 100% { transform: rotate(-6deg); }
            50% { transform: rotate(10deg); }
          }
          @keyframes bubbleUp {
            0% { transform: translateY(0px) scale(0.8); opacity: 0.9; }
            100% { transform: translateY(-22px) scale(1.25); opacity: 0; }
          }
          @keyframes earTwitch {
            0%, 92%, 100% { transform: rotate(0deg); }
            95% { transform: rotate(-8deg); }
          }
          .cat-body { animation: catBob 2.2s ease-in-out infinite; }
          .cat-tail { transform-origin: 96px 88px; animation: tailWag 1.8s ease-in-out infinite; }
          .cat-ear { transform-origin: 42px 32px; animation: earTwitch 4s ease-in-out infinite; }
          .bubble-1 { animation: bubbleUp 1.6s ease-out infinite; }
          .bubble-2 { animation: bubbleUp 1.6s ease-out 0.6s infinite; }
          .bubble-3 { animation: bubbleUp 1.6s ease-out 1.1s infinite; }
        `}</style>

        <svg viewBox="0 0 160 130" className="w-full h-full overflow-visible">
          {/* Soft Desk Shadow */}
          <ellipse cx="78" cy="116" rx="52" ry="7" fill="#D3E3FD" opacity="0.65" />

          <g className="cat-body">
            {/* Wagging Tail */}
            <path
              className="cat-tail"
              d="M98 92 C118 92, 126 72, 118 58"
              fill="none"
              stroke="#5F6368"
              strokeWidth="7"
              strokeLinecap="round"
            />

            {/* Cat Body (Lab Coat White + Soft Slate) */}
            <ellipse cx="68" cy="86" rx="28" ry="26" fill="#FFFFFF" stroke="#E3E8EF" strokeWidth="2.5" />
            {/* Tiny Blue Lab Tie / Collar */}
            <path d="M54 68 Q68 74 82 68" fill="none" stroke="#1A73E8" strokeWidth="4" strokeLinecap="round" />
            <circle cx="68" cy="73" r="3.5" fill="#F9AB00" />

            {/* Cat Head */}
            <circle cx="68" cy="48" r="24" fill="#FFFFFF" stroke="#E3E8EF" strokeWidth="2.5" />

            {/* Left & Right Ears */}
            <g className="cat-ear">
              <path d="M46 34 L42 14 L59 26 Z" fill="#FFFFFF" stroke="#E3E8EF" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M47 30 L45 19 L55 26 Z" fill="#FDE7E9" />
            </g>
            <path d="M90 34 L94 14 L77 26 Z" fill="#FFFFFF" stroke="#E3E8EF" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M89 30 L91 19 L81 26 Z" fill="#FDE7E9" />

            {/* Cute Google-Blue Lab Goggles */}
            <rect x="46" y="38" width="19" height="14" rx="6" fill="#E8F0FE" stroke="#1A73E8" strokeWidth="2.5" />
            <rect x="71" y="38" width="19" height="14" rx="6" fill="#E8F0FE" stroke="#1A73E8" strokeWidth="2.5" />
            <line x1="65" y1="44" x2="71" y2="44" stroke="#1A73E8" strokeWidth="2.5" />

            {/* Happy Eyes inside Goggles */}
            <circle cx="55.5" cy="45" r="2.6" fill="#1F1F1F" />
            <circle cx="80.5" cy="45" r="2.6" fill="#1F1F1F" />
            <circle cx="56.5" cy="44" r="0.9" fill="#FFFFFF" />
            <circle cx="81.5" cy="44" r="0.9" fill="#FFFFFF" />

            {/* Pink Nose & Whiskers */}
            <polygon points="65,53 71,53 68,56.5" fill="#F28B82" />
            <path d="M64 58 Q68 61 72 58" fill="none" stroke="#5F6368" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="39" y1="51" x2="49" y2="53" stroke="#9AA0A6" strokeWidth="1.3" strokeLinecap="round" />
            <line x1="39" y1="56" x2="49" y2="56" stroke="#9AA0A6" strokeWidth="1.3" strokeLinecap="round" />
            <line x1="87" y1="53" x2="97" y2="51" stroke="#9AA0A6" strokeWidth="1.3" strokeLinecap="round" />
            <line x1="87" y1="56" x2="97" y2="56" stroke="#9AA0A6" strokeWidth="1.3" strokeLinecap="round" />

            {/* Paws */}
            <ellipse cx="52" cy="106" rx="8" ry="5" fill="#FFFFFF" stroke="#E3E8EF" strokeWidth="2" />
            <ellipse cx="84" cy="106" rx="8" ry="5" fill="#FFFFFF" stroke="#E3E8EF" strokeWidth="2" />
          </g>

          {/* Bubbling Erlenmeyer Flask on Right */}
          <g transform="translate(114, 72)">
            <path
              d="M12 4 L20 4 L20 14 L30 34 C31 37 29 40 26 40 L6 40 C3 40 1 37 2 34 L12 14 Z"
              fill="#E6F4EA"
              stroke="#188038"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path d="M6 28 L26 28 L28.5 34 C29 36 28 38 25.5 38 L6.5 38 C4 38 3 36 3.5 34 Z" fill="#34A853" opacity="0.65" />
            <circle className="bubble-1" cx="15" cy="18" r="2.8" fill="#1A73E8" />
            <circle className="bubble-2" cx="19" cy="14" r="2.2" fill="#34A853" />
            <circle className="bubble-3" cx="13" cy="12" r="1.8" fill="#FBBC04" />
          </g>
        </svg>
      </div>

      {/* Animated Status & Progress Bar (hidden in compact hero mascot mode) */}
      {!compact && (
        <div className="space-y-2 max-w-md w-full">
          <div className="text-sm font-display font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
            {subtitle || messages[stepIdx]}
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#E8F0FE] dark:bg-[#282A2C] overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#1A73E8] via-[#34A853] to-[#FBBC04] animate-[pulse_1.4s_ease-in-out_infinite] translate-x-1/2" />
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {messages.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === stepIdx ? "w-5 bg-[#1A73E8]" : "w-1.5 bg-[#DADCE0] dark:bg-[#444746]"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

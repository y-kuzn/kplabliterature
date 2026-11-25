"use client";

import React, { useEffect, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";

interface Props {
  title: string;
  description: string;
  bullets?: string[];
  align?: "left" | "center" | "right";
  size?: "xs" | "sm";
}

/**
 * Google Material 3 contextual "?" help popover.
 * Opens on hover (desktop) or tap/click (mobile/touch) without triggering parent buttons.
 */
export default function HelpTip({
  title,
  description,
  bullets,
  align = "center",
  size = "xs",
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const posClass =
    align === "left"
      ? "left-0"
      : align === "right"
      ? "right-0"
      : "left-1/2 -translate-x-1/2";

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex items-center align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        aria-label={`Help: ${title}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setOpen((o) => !o);
          }
        }}
        className={`inline-flex items-center justify-center rounded-full text-[#747775] dark:text-[#9AA0A6] hover:text-[#1A73E8] dark:hover:text-[#A8C7FA] hover:bg-[#E8F0FE]/70 dark:hover:bg-[#282A2C] transition cursor-help ${
          size === "sm" ? "w-4 h-4" : "w-3.5 h-3.5"
        }`}
      >
        <HelpCircle className={size === "sm" ? "w-3.5 h-3.5" : "w-3 h-3"} />
      </span>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-full mt-2 ${posClass} z-50 w-64 sm:w-72 p-3.5 rounded-2xl bg-white dark:bg-[#282A2C] border border-[#E3E8EF] dark:border-[#444746] shadow-xl text-left font-normal normal-case tracking-normal pointer-events-auto`}
        >
          <div className="text-xs font-display font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mb-1">
            {title}
          </div>
          <p className="text-[11px] leading-relaxed text-[#444746] dark:text-[#C4C7C5]">
            {description}
          </p>
          {bullets && bullets.length > 0 && (
            <ul className="mt-2 space-y-1 text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#1A73E8] dark:text-[#A8C7FA] font-bold">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </span>
  );
}

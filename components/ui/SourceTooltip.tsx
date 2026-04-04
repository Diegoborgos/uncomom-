"use client"

import { useState, useEffect, useRef, ReactNode } from "react"

type SourceTooltipProps = {
  /** Content to show in the tooltip */
  content: string
  /** The wrapped element that triggers the tooltip */
  children: ReactNode
  /** Show the ⓘ icon indicator. Default true */
  showIcon?: boolean
  /** Position: where the icon appears relative to children */
  iconPosition?: "inline" | "top-right"
}

/**
 * SourceTooltip — the ONLY tooltip pattern for data source info.
 * Desktop: hover to show, click to pin, click-outside to dismiss.
 * Mobile: tap to show, tap-outside to dismiss.
 *
 * Usage:
 *   <SourceTooltip content="3 signals · 2 sources · Updated 7h ago">
 *     <span>Child Safety</span>
 *   </SourceTooltip>
 *
 *   <SourceTooltip content="Estimated data" iconPosition="top-right">
 *     <div className="...">~5 days</div>
 *   </SourceTooltip>
 */
export default function SourceTooltip({
  content,
  children,
  showIcon = true,
  iconPosition = "inline",
}: SourceTooltipProps) {
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const open = hovered || pinned

  useEffect(() => {
    if (!pinned) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setPinned(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [pinned])

  return (
    <div
      className="relative inline-flex items-center"
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => setPinned(!pinned)}
        className="text-left flex items-center gap-1 group hover:opacity-80 transition-opacity"
      >
        {children}
        {showIcon && iconPosition === "inline" && (
          <span className="text-[9px] text-[var(--text-secondary)]/40 group-hover:text-[var(--text-secondary)] transition-colors shrink-0">
            &#9432;
          </span>
        )}
      </button>

      {showIcon && iconPosition === "top-right" && (
        <span className="absolute top-1 right-1 text-[9px] text-[var(--text-secondary)]/40 pointer-events-none">
          &#9432;
        </span>
      )}

      {open && (
        <div className="absolute left-0 bottom-full mb-1.5 z-40 max-w-[260px]">
          <div className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[10px] text-[var(--text-secondary)] shadow-lg whitespace-nowrap">
            {content}
          </div>
          <div className="ml-4 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[var(--surface-elevated)]" />
        </div>
      )}
    </div>
  )
}

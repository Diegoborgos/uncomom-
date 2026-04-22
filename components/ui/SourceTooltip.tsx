"use client"

import { useState, useEffect, useRef, ReactNode } from "react"

export type CitedSource = {
  name: string
  url: string | null
  type?: string
}

type SourceTooltipProps = {
  /** Brief content (count line, "Estimated data", etc.). Optional if `sources` provided. */
  content?: string
  /** Clickable citation sources rendered as links in the popover. */
  sources?: CitedSource[]
  /** Heading shown above the source list. */
  title?: string
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
 * Two render modes:
 *  - Brief: pass `content` only ("3 signals · 2 sources · Updated 7h ago")
 *  - Rich:  pass `sources` (and optional `title` + `content`) to render
 *           clickable citation links to the underlying source URLs.
 *
 * Usage:
 *   <SourceTooltip content="3 signals · 2 sources">
 *     <span>Child Safety</span>
 *   </SourceTooltip>
 *
 *   <SourceTooltip
 *     title="Healthcare sources"
 *     content="12 signals · 3 sources · Updated 2h ago"
 *     sources={[
 *       { name: "World Bank", url: "https://...", type: "public_api" },
 *       { name: "CUF Hospital", url: "https://...", type: "researched" },
 *     ]}>
 *     <div>...</div>
 *   </SourceTooltip>
 */
export default function SourceTooltip({
  content,
  sources,
  title,
  children,
  showIcon = true,
  iconPosition = "inline",
}: SourceTooltipProps) {
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const open = hovered || pinned
  const hasSources = !!sources && sources.length > 0

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
      className="relative flex w-full items-center"
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => setPinned(!pinned)}
        className="text-left flex items-center gap-1 w-full group hover:opacity-80 transition-opacity"
      >
        {children}
        {showIcon && iconPosition === "inline" && (
          <span className="text-[9px] text-[var(--text-secondary)] opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
            &#9432;
          </span>
        )}
      </button>

      {showIcon && iconPosition === "top-right" && (
        <span className="absolute top-1 right-1 text-[9px] text-[var(--text-secondary)] opacity-40 pointer-events-none">
          &#9432;
        </span>
      )}

      {open && (
        <div className="absolute left-0 bottom-full mb-1.5 z-40 max-w-[280px]">
          <div className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[10px] text-[var(--text-secondary)] shadow-lg space-y-1.5">
            {title && <div className="font-medium text-[var(--text-primary)]">{title}</div>}
            {content && <div className="whitespace-nowrap">{content}</div>}
            {hasSources && (
              <ul className="space-y-1 pt-1 border-t border-[var(--border)]">
                {sources!.slice(0, 8).map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span
                      className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                        s.type === "public_api" || s.type === "field_report" || s.type === "admin_manual" || s.type === "manual"
                          ? "bg-[var(--accent-green)]"
                          : s.type === "researched"
                            ? "bg-[var(--text-secondary)]"
                            : "bg-[var(--accent-warm)]"
                      }`}
                    />
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[var(--accent-green)] hover:underline break-words"
                      >
                        {s.name}
                      </a>
                    ) : (
                      <span className="text-[var(--text-primary)]">{s.name}</span>
                    )}
                  </li>
                ))}
                {sources!.length > 8 && (
                  <li className="text-[var(--text-secondary)] pl-3">+ {sources!.length - 8} more</li>
                )}
              </ul>
            )}
          </div>
          <div className="ml-4 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[var(--surface-elevated)]" />
        </div>
      )}
    </div>
  )
}

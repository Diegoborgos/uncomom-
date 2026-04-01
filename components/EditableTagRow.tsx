"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

type EditableTagRowProps = {
  label: string
  field: string
  value: string | string[] | number[]
  options?: string[]
  mode: "single" | "multi" | "ages" | "text"
  formatDisplay?: (val: string) => string
}

export default function EditableTagRow({ label, field, value, options = [], mode, formatDisplay }: EditableTagRowProps) {
  const { family, refreshFamily } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const [textValue, setTextValue] = useState(typeof value === "string" ? value : "")
  const [newAge, setNewAge] = useState("")
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocalValue(value)
    if (typeof value === "string") setTextValue(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        if (editing) handleSave()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, localValue, textValue])

  const handleSave = async () => {
    if (!family || saving) return
    setSaving(true)

    let updateValue: string | string[] | number[]
    if (mode === "text") {
      updateValue = textValue
    } else if (mode === "ages") {
      updateValue = localValue as number[]
    } else {
      updateValue = localValue
    }

    await supabase
      .from("families")
      .update({ [field]: updateValue, updated_at: new Date().toISOString() })
      .eq("id", family.id)

    await refreshFamily()
    setSaving(false)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const display = (val: string) => formatDisplay ? formatDisplay(val) : val.charAt(0).toUpperCase() + val.slice(1)

  // Not editing — show tags with tap hint
  if (!editing) {
    const isEmpty = !value || (Array.isArray(value) && value.length === 0)

    return (
      <div className="flex items-start gap-3 group">
        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider w-20 shrink-0 pt-1.5">{label}</span>
        <div className="flex flex-wrap gap-1.5 cursor-pointer" onClick={() => setEditing(true)}>
          {isEmpty ? (
            <span className="text-xs px-3 py-1.5 rounded-full border border-dashed border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors">
              + Add {label.toLowerCase()}
            </span>
          ) : (
            <>
              {Array.isArray(value) ? (
                value.map((v) => (
                  <span key={String(v)} className="text-xs px-3 py-1.5 rounded-full bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/20 hover:bg-[var(--accent-green)]/20 transition-colors">
                    {mode === "ages" ? `${v} years` : display(String(v))}
                  </span>
                ))
              ) : (
                <span className="text-xs px-3 py-1.5 rounded-full bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/20 hover:bg-[var(--accent-green)]/20 transition-colors">
                  {display(String(value))}
                </span>
              )}
              <span className="text-[10px] text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity pt-2">
                tap to edit
              </span>
            </>
          )}
          {saved && <span className="text-[10px] text-[var(--accent-green)] pt-2">✓ Saved</span>}
        </div>
      </div>
    )
  }

  // Editing — show appropriate editor
  return (
    <div ref={wrapperRef} className="flex items-start gap-3">
      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider w-20 shrink-0 pt-1.5">{label}</span>
      <div className="flex-1">
        {mode === "single" && (
          <div className="flex flex-wrap gap-1.5">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { setLocalValue(opt); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  localValue === opt
                    ? "bg-[var(--accent-green)] text-black border-[var(--accent-green)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)]"
                }`}
              >
                {display(opt)}
              </button>
            ))}
            <button onClick={handleSave} disabled={saving} className="text-xs px-3 py-1.5 rounded-full bg-[var(--accent-green)] text-black font-medium">
              {saving ? "..." : "Save"}
            </button>
          </div>
        )}

        {mode === "multi" && (
          <div className="flex flex-wrap gap-1.5">
            {options.map((opt) => {
              const selected = Array.isArray(localValue) && (localValue as string[]).includes(opt)
              return (
                <button
                  key={opt}
                  onClick={() => {
                    const arr = Array.isArray(localValue) ? (localValue as string[]) : []
                    if (selected) {
                      setLocalValue(arr.filter((v) => v !== opt))
                    } else {
                      setLocalValue([...arr, opt])
                    }
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selected
                      ? "bg-[var(--accent-green)] text-black border-[var(--accent-green)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)]"
                  }`}
                >
                  {display(opt)}
                </button>
              )
            })}
            <button onClick={handleSave} disabled={saving} className="text-xs px-3 py-1.5 rounded-full bg-[var(--accent-green)] text-black font-medium">
              {saving ? "..." : "Done"}
            </button>
          </div>
        )}

        {mode === "ages" && (
          <div className="flex flex-wrap gap-2 items-center">
            {(localValue as number[]).map((age, i) => (
              <div key={i} className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const ages = [...(localValue as number[])]
                    if (ages[i] > 0) ages[i]--
                    setLocalValue(ages)
                  }}
                  className="w-6 h-6 rounded-full border border-[var(--border)] text-[var(--text-secondary)] text-xs flex items-center justify-center hover:border-[var(--accent-green)]"
                >−</button>
                <span className="text-xs font-mono w-8 text-center text-[var(--accent-green)]">{age}</span>
                <button
                  onClick={() => {
                    const ages = [...(localValue as number[])]
                    ages[i]++
                    setLocalValue(ages)
                  }}
                  className="w-6 h-6 rounded-full border border-[var(--border)] text-[var(--text-secondary)] text-xs flex items-center justify-center hover:border-[var(--accent-green)]"
                >+</button>
                <button
                  onClick={() => {
                    const ages = [...(localValue as number[])]
                    ages.splice(i, 1)
                    setLocalValue(ages)
                  }}
                  className="text-[10px] text-[var(--text-secondary)] hover:text-red-400 ml-1"
                >✕</button>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="18"
                value={newAge}
                onChange={(e) => setNewAge(e.target.value)}
                placeholder="age"
                className="w-12 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
              />
              <button
                onClick={() => {
                  const age = parseInt(newAge)
                  if (!isNaN(age) && age >= 0 && age <= 18) {
                    setLocalValue([...(localValue as number[]), age])
                    setNewAge("")
                  }
                }}
                className="text-xs text-[var(--accent-green)] hover:underline"
              >+ Add</button>
            </div>
            <button onClick={handleSave} disabled={saving} className="text-xs px-3 py-1.5 rounded-full bg-[var(--accent-green)] text-black font-medium">
              {saving ? "..." : "Save"}
            </button>
          </div>
        )}

        {mode === "text" && (
          <div>
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              rows={3}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)] resize-none"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button onClick={handleSave} disabled={saving} className="text-xs px-3 py-1.5 rounded-full bg-[var(--accent-green)] text-black font-medium">
                {saving ? "..." : "Save"}
              </button>
              <button onClick={() => { setEditing(false); setTextValue(typeof value === "string" ? value : ""); }} className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl font-bold mb-8">About Uncomun</h1>

      <div className="space-y-6 text-[var(--text-secondary)] leading-relaxed">
        <p>
          Uncomun is a city directory for families who have chosen to live and travel globally.
          Not backpackers. Not gap-year nomads. Families — with kids, with businesses, with
          real logistics to sort out.
        </p>

        <p>
          We built this because every existing tool was designed for solo digital nomads.
          The scores, the costs, the community — none of it accounted for school access,
          child safety, family healthcare, or the cost of raising a family abroad.
        </p>

        <p>
          Uncomun is the reference we wished existed. A directory where the unit of account
          is the family, not the individual.
        </p>

        <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] mt-10 mb-4">
          Roadmap
        </h2>

        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <span className="shrink-0 w-8 h-8 rounded-full bg-[var(--accent-green)] text-[var(--bg)] flex items-center justify-center text-sm font-bold">1</span>
            <div>
              <p className="font-medium text-[var(--text-primary)]">The Directory</p>
              <p className="text-sm">City scores, costs, and family-specific data for cities worldwide. You&apos;re looking at it.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <span className="shrink-0 w-8 h-8 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)] flex items-center justify-center text-sm font-bold border border-[var(--border)]">2</span>
            <div>
              <p className="font-medium text-[var(--text-primary)]">Community</p>
              <p className="text-sm">Family profiles, trip tracking, city reviews, and a way to find other families nearby.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <span className="shrink-0 w-8 h-8 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)] flex items-center justify-center text-sm font-bold border border-[var(--border)]">3</span>
            <div>
              <p className="font-medium text-[var(--text-primary)]">Schools & Visas</p>
              <p className="text-sm">A searchable school directory and visa dashboard to make the hardest parts of family travel easier.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

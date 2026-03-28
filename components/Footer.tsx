import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="font-serif font-bold text-[var(--text-primary)]">Uncomun</span>
          {" "}&mdash; For families who live differently
        </p>
        <nav className="flex items-center gap-6 text-sm text-[var(--text-secondary)]">
          <Link href="/about" className="hover:text-[var(--text-primary)] transition-colors">About</Link>
          <span className="cursor-not-allowed">Data Sources</span>
          <span className="cursor-not-allowed">Submit a City</span>
          <Link href="/join" className="hover:text-[var(--text-primary)] transition-colors">Join the community</Link>
        </nav>
      </div>
    </footer>
  )
}

import Link from "next/link"
import WaitlistForm from "./WaitlistForm"

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        {/* Waitlist */}
        <div className="max-w-md mx-auto text-center">
          <p className="font-serif text-lg font-bold mb-2">Stay in the loop</p>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Get notified when we launch new features for traveling families.
          </p>
          <WaitlistForm />
        </div>

        {/* Links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-[var(--border)]">
          <p className="text-sm text-[var(--text-secondary)]">
            <span className="font-serif font-bold text-[var(--text-primary)]">Uncomun</span>
            {" "}&mdash; For families who live differently
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-secondary)]">
            <Link href="/about" className="hover:text-[var(--text-primary)] transition-colors">About</Link>
            <Link href="/compare" className="hover:text-[var(--text-primary)] transition-colors">Compare</Link>
            <Link href="/schools" className="hover:text-[var(--text-primary)] transition-colors">Schools</Link>
            <Link href="/visas" className="hover:text-[var(--text-primary)] transition-colors">Visas</Link>
            <Link href="/signup" className="hover:text-[var(--text-primary)] transition-colors">Join</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

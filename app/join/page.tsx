import Link from "next/link"

export default function JoinPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <h1 className="font-serif text-4xl font-bold mb-4">Join Uncomun</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        We&apos;re building the community layer next. Leave your mark — family accounts,
        trip logging, and city reviews are coming.
      </p>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8">
        <p className="text-[var(--accent-warm)] font-medium mb-2">Coming soon</p>
        <p className="text-sm text-[var(--text-secondary)]">
          Sign-ups will open when Phase 2 launches.
        </p>
      </div>
      <Link
        href="/"
        className="inline-block mt-8 text-sm text-[var(--accent-green)] hover:underline"
      >
        &larr; Back to cities
      </Link>
    </div>
  )
}

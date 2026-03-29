import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "How the FIS\u2122 Works \u2014 Methodology | Uncomun",
  description: "The Uncomun Family Intelligence Score is calculated from 1,000+ signals across 9 dimensions. Here is exactly how it works.",
}

const DIMENSIONS = [
  { name: "Child Safety", weight: 22, description: "Street crime, traffic safety, air/water quality, disease risk, political stability, member safety reports, stroller accessibility." },
  { name: "Education Access", weight: 20, description: "International school count and fees, curriculum availability (IB, British, American, Montessori), homeschool legal status and enforcement reality, worldschooling hub presence, enrollment difficulty." },
  { name: "Family Cost", weight: 18, description: "Family-of-4 monthly estimate, 2br/3br rent, school fees, childcare, grocery index, member-reported actual spend and housing availability." },
  { name: "Healthcare", weight: 12, description: "System quality, paediatric access, English-speaking doctors, appointment speed, emergency care, international insurance acceptance." },
  { name: "Nature & Outdoor", weight: 10, description: "Beach and mountain access, park density, playground quality, comfortable outdoor months, cycling infrastructure, environmental quality." },
  { name: "Family Community", weight: 8, description: "Uncomun families currently there and historically, return rate, worldschooling activity, expat family density, meetup frequency, local attitude toward families. Includes arrival curve modifiers: cities where setup takes ≤2 weeks get a bonus; cities requiring 8+ weeks to become operational are penalised. First community connection speed also modifies this score." },
  { name: "Remote Work", weight: 5, description: "Download/upload speeds, internet reliability, coworking count, timezone overlap with EU and US." },
  { name: "Visa & Legal", weight: 3, description: "Digital nomad visa availability, dependent inclusion, income requirements, processing time and difficulty." },
  { name: "Lifestyle & Culture", weight: 2, description: "English proficiency, city pace, restaurant quality, cultural activities for kids, international food availability." },
]

const DATA_SOURCES = [
  "Numbeo \u2014 Cost of living and crime indices",
  "WHO \u2014 Traffic fatality rates, healthcare system quality, air/water quality",
  "IQAir \u2014 Real-time and historical air quality data",
  "Ookla Speedtest \u2014 Internet speed and reliability",
  "Global Peace Index \u2014 Political stability",
  "EF English Proficiency Index \u2014 English proficiency by country",
  "Environmental Performance Index \u2014 Environmental quality",
  "CDC/WHO \u2014 Disease risk data (dengue, malaria)",
  "Uncomun Member Field Reports \u2014 Family experience data (collected as members contribute)",
  "Uncomun Platform Data \u2014 Trip logs, community activity (grows with membership)",
]

export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-serif text-4xl font-bold mb-3">
        How the FIS&trade; Works
      </h1>
      <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-10">
        The Uncomun Family Intelligence Score&trade; is calculated from 1,000+ data points across
        9 dimensions &mdash; combining researched data from public sources with member field reports
        as families contribute their real experiences.
      </p>

      {/* Why it exists */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl font-bold mb-4">Why this is different</h2>
        <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
          <p>
            Every existing livability index &mdash; EIU, Numbeo, Mercer &mdash; scores cities for general
            adult professionals. None of them are built around the specific, layered, often contradictory
            needs of a family with children who also works remotely and moves frequently.
          </p>
          <p>
            The FIS&trade; is the first city score built exclusively for traveling families. It weights
            child safety, school access, and family cost as the top three dimensions &mdash; because
            that is what families actually decide on. A city can have excellent nightlife and coworking
            but score poorly if children cannot play outside safely or if there are no school options
            for a 7-year-old.
          </p>
        </div>
      </section>

      {/* 9 Dimensions */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl font-bold mb-6">9 Dimensions</h2>
        <div className="space-y-4">
          {DIMENSIONS.map((d) => (
            <div key={d.name} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{d.name}</h3>
                <span className="text-xs font-mono text-[var(--accent-green)]">{d.weight}% weight</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--surface-elevated)] mb-3">
                <div className="h-full rounded-full bg-[var(--accent-green)]" style={{ width: `${d.weight * 4}%` }} />
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{d.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Personal FIS */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl font-bold mb-4">The Personalised FIS&trade;</h2>
        <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
          <p>
            The default FIS&trade; uses the standard weights above. But when you are logged in as a
            member, the score recalibrates around what matters to <em>your</em> specific family.
          </p>
          <p>
            A family with toddlers sees healthcare and safety weighted higher. A family with teens
            sees education and community weighted higher. A family following an unschooling approach
            sees nature and lifestyle weighted higher than school access.
          </p>
          <p>
            The same city can have completely different FIS&trade; scores for different families.
            Chiang Mai might score 86 for a family with young children following an unschooling
            approach on a tight budget &mdash; and 72 for a family with teenagers who need IB
            curriculum and an active teen social scene.
          </p>
          <p>
            This is the thing no AI can replicate. It requires knowing your family, your kids,
            your priorities &mdash; and combining that with verified data from families who have
            actually been there.
          </p>
        </div>
      </section>

      {/* Member Field Reports */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl font-bold mb-4">Member Field Reports</h2>
        <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
          <p>
            As Uncomun grows, the most valuable data will come from members who have actually lived
            in each city with their families. After logging a trip and marking it as complete,
            members can submit a structured Family Field Report covering all 9 dimensions.
          </p>
          <p>
            Field reports collect arrival curve data that no other platform has: how many
            days until you secured housing, made your first family connection, enrolled kids in
            school, and felt fully operational. This data is broken down by passport tier
            (strong, medium, limited) so families see processing times relevant to their
            nationality.
          </p>
          <p>
            Currently, city scores are based on researched data from public sources. As member
            field reports accumulate, they will progressively replace estimated values with
            verified family experience data &mdash; making the FIS&trade; more accurate over time.
          </p>
        </div>
      </section>

      {/* Data Sources */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl font-bold mb-4">Data Sources</h2>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <ul className="space-y-2">
            {DATA_SOURCES.map((s) => (
              <li key={s} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                <span className="text-[var(--accent-green)] shrink-0 mt-0.5">&bull;</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl font-bold mb-6">FAQ</h2>
        <div className="space-y-6">
          <FAQ q="Can cities pay to improve their score?" a="No. Never. The FIS is calculated algorithmically from public data and member reports. No city, tourism board, or commercial partner can influence a score." />
          <FAQ q="How often is data updated?" a="Field reports trigger nightly aggregation — new reports are reflected in city scores within 24 hours. Public data sources (Numbeo, IQAir) are refreshed monthly. Every signal tracks its source, freshness, and confidence level." />
          <FAQ q="Why does my personal FIS differ from the default?" a="The personal FIS recalibrates dimension weights based on your family's profile, kids' ages, education approach, and behavioral signals from your platform usage." />
          <FAQ q="How many field reports does a city need for reliable scores?" a="We consider a city's FIS robust after 10+ field reports from different families. Below that, we rely more heavily on public data sources and flag the lower data confidence." />
          <FAQ q="Can I see how my FIS was calculated?" a="Yes. Your personal FIS breakdown shows exactly which dimensions were weighted up or down and why, based on your family profile." />
        </div>
      </section>

      <div className="text-center pt-6 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          The FIS&trade; is a continuously improving system. As more families contribute
          field reports, the scores become more precise and more trustworthy.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
          <Link href="/" className="text-sm text-[var(--accent-green)] hover:underline">
            Explore cities &rarr;
          </Link>
          <Link
            href="/signup"
            className="text-sm px-5 py-2.5 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
          >
            Join Uncomun
          </Link>
        </div>
        <p className="text-xs text-[var(--text-secondary)]/60 mt-4">
          One payment. Lifetime access. Your family&apos;s city intelligence layer.
        </p>
      </div>
    </div>
  )
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-[var(--border)] pb-4">
      <p className="font-medium text-sm mb-1">{q}</p>
      <p className="text-sm text-[var(--text-secondary)]">{a}</p>
    </div>
  )
}

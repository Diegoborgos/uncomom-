"use client"

import { City } from "@/lib/types"
import { getFISColor } from "@/lib/fis"
import { useAuth } from "@/lib/auth-context"
import { PaywallBlur } from "./Paywall"

/**
 * Renders deep signal intelligence for cities that have full signals data.
 * Shows headline stats freely, details behind PaywallBlur.
 */
export default function CityIntelligence({ city }: { city: City }) {
  const s = city.signals
  if (!s) return null

  return (
    <div className="space-y-8">
      {/* Setup Difficulty */}
      <IntelSection title="Setup Difficulty" subtitle="How hard is it to arrive and get operational">
        <GatedDetails>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="font-mono text-2xl font-bold" style={{ color: getFISColor(s.setupDifficulty.overallSetupScore) }}>
                {s.setupDifficulty.overallSetupScore}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">Setup score</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold">{s.setupDifficulty.memberSetupTimelineWeeks}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">weeks to operational</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <TimelineItem label="Housing secured" value={`~${s.setupDifficulty.housingSetupDays} days`} />
            <TimelineItem label="SIM card" value={`~${s.setupDifficulty.simCardSetupHours} hours`} />
            <TimelineItem label="Bank account" value={s.setupDifficulty.bankAccountOpenable ? `~${s.setupDifficulty.bankAccountDays} days` : "Not available"} />
            <TimelineItem label="GP registered" value={`~${s.setupDifficulty.gpRegistrationDays} days`} />
            <TimelineItem label="School enrolled" value={`~${s.setupDifficulty.schoolEnrollmentSetupDays} days`} />
            <TimelineItem label="First family connection" value={`~${s.setupDifficulty.firstCommunityConnectionDays} days`} />
          </div>
          {s.setupDifficulty.schoolEnrollmentBlocks.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-[var(--text-secondary)] mb-1.5">Enrollment blockers to know</p>
              <ul className="space-y-1">
                {s.setupDifficulty.schoolEnrollmentBlocks.map((block, i) => (
                  <li key={i} className="text-xs text-[var(--accent-warm)] flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5">!</span>
                    <span>{block}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {s.setupDifficulty.memberSetupNarrative && (
            <MemberQuote quote={s.setupDifficulty.memberSetupNarrative} />
          )}
        </GatedDetails>
      </IntelSection>

      {/* Pediatric Emergency Path */}
      <IntelSection title="Pediatric Emergency Care" subtitle="What happens if your child needs emergency care at 11pm">
        <GatedDetails>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="font-mono text-2xl font-bold" style={{ color: getFISColor(s.healthcare.emergencyCareQuality) }}>
                {s.healthcare.paediatricEmergencyResponseTime}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">min response</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold" style={{ color: getFISColor(s.healthcare.emergencyCareQuality) }}>
                {s.healthcare.emergencyCareQuality}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">care quality</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold">{s.healthcare.englishSpeakingPaediatricianCount}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">EN paediatricians</p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
            {s.healthcare.paediatricEmergencyPath}
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <SignalPill label="EN-speaking paediatrician" value={s.healthcare.englishSpeakingPaediatrician} />
            <SignalPill label="Intl insurance accepted" value={s.healthcare.internationalInsuranceAccepted} />
            <TimelineItem label="Routine appointment" value={`${s.healthcare.appointmentSpeedDays} day wait`} />
            <TimelineItem label="Nearest children's hospital" value={`${s.healthcare.nearestChildrensHospital} km`} />
          </div>
          {s.healthcare.memberEmergencyNarrative && (
            <MemberQuote quote={s.healthcare.memberEmergencyNarrative} />
          )}
        </GatedDetails>
      </IntelSection>

      {/* School Enrollment Reality */}
      <IntelSection title="School Enrollment Reality" subtitle="Not just what schools exist — how hard it is to actually get in">
        <GatedDetails>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="font-mono text-2xl font-bold">{s.educationAccess.internationalSchoolCount}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">int&apos;l schools</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold">{s.educationAccess.waitlistMonthsTypical}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">month waitlist</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold" style={{ color: getFISColor(s.educationAccess.enrollmentDifficulty) }}>
                {s.educationAccess.enrollmentDifficulty}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">ease of enrollment</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <SignalPill label="August arrive, September start" value={s.educationAccess.augustArrivalSeptemberEnrollPossible} />
            <SignalPill label="Mid-year entry possible" value={s.educationAccess.midYearEntryPossible} />
            <SignalPill label="Requires local address" value={s.educationAccess.enrollmentRequiresLocalAddress} negative />
            <SignalPill label="Requires tax number" value={s.educationAccess.enrollmentRequiresLocalTaxNumber} negative />
            <TimelineItem label="Processing time" value={`~${s.educationAccess.processingTimeWeeks} weeks`} />
            <TimelineItem label="Fee range" value={`${s.educationAccess.internationalSchoolMinFee}–${s.educationAccess.internationalSchoolMaxFee}/mo`} />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {s.educationAccess.ibAvailable && <CurriculumChip label="IB" />}
            {s.educationAccess.britishCurriculumAvailable && <CurriculumChip label="British" />}
            {s.educationAccess.americanCurriculumAvailable && <CurriculumChip label="American" />}
            {s.educationAccess.montessoriAvailable && <CurriculumChip label="Montessori" />}
            {s.educationAccess.steinerWaldorfAvailable && <CurriculumChip label="Waldorf" />}
            {s.educationAccess.democraticSchoolAvailable && <CurriculumChip label="Democratic" />}
          </div>
          {s.educationAccess.memberEnrollmentNarrative && (
            <MemberQuote quote={s.educationAccess.memberEnrollmentNarrative} />
          )}
        </GatedDetails>
      </IntelSection>

      {/* Passport-Aware Visa Reality */}
      <IntelSection title="Visa Reality by Passport" subtitle="Processing experience differs dramatically by passport strength">
        <GatedDetails>
          <div className="space-y-3 mb-4">
            <PassportRow
              tier="Strong"
              examples="US, UK, EU, AU, CA, JP"
              days={s.visa.strongPassportProcessingDays}
              approval={s.visa.strongPassportApprovalRate}
              friendly={s.visa.strongPassportVisaFriendly}
            />
            <PassportRow
              tier="Medium"
              examples="BR, MX, AR, TR, IN, ZA"
              days={s.visa.mediumPassportProcessingDays}
              approval={s.visa.mediumPassportApprovalRate}
              friendly={s.visa.mediumPassportVisaFriendly}
            />
            <PassportRow
              tier="Limited"
              examples="NG, GH, PK, KE, UG"
              days={s.visa.limitedPassportProcessingDays}
              approval={s.visa.limitedPassportApprovalRate}
              friendly={s.visa.limitedPassportVisaFriendly}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <SignalPill label="Nomad visa available" value={s.visa.nomadVisaAvailable} />
            <SignalPill label="Includes dependents" value={s.visa.nomadVisaIncludesDependents} />
            <SignalPill label="Path to residency" value={s.visa.nomadVisaPathToResidency} />
            <SignalPill label="Requires lawyer" value={s.visa.requiresLocalLawyer} negative />
          </div>
          {s.visa.memberVisaNarrative && (
            <MemberQuote quote={s.visa.memberVisaNarrative} />
          )}
        </GatedDetails>
      </IntelSection>

      {/* Kids Social Integration */}
      <IntelSection title="Kids Social Integration" subtitle="How fast do children make friends here">
        <GatedDetails>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="font-mono text-2xl font-bold" style={{ color: getFISColor(s.community.kidsIntegrationSpeed) }}>
                {s.community.kidsIntegrationSpeedWeeks}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">weeks to friends</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold" style={{ color: getFISColor(s.community.kidsActivitiesForNewcomers) }}>
                {s.community.kidsActivitiesForNewcomers}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">newcomer activities</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold">{s.community.meetupsPerMonth}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">meetups/month</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TimelineItem label="Int'l kid community" value={`${s.community.internationalKidCommunitySize}/100`} />
            <TimelineItem label="Playgroup availability" value={`${s.community.kidsPlaygroupAvailability}/100`} />
            <TimelineItem label="Teen scene" value={`${s.community.teenCommunityRating}/100`} />
            <TimelineItem label="First connection" value={`~${s.community.daysToFirstCommunityConnection} days`} />
            <SignalPill label="WhatsApp groups accessible" value={s.community.whatsappGroupsAccessible} />
            <TimelineItem label="Solo parent rating" value={`${s.community.soloParentCommunityRating}/100`} />
          </div>
        </GatedDetails>
      </IntelSection>

      {/* Data quality footer */}
      <div className="rounded-lg bg-[var(--surface-elevated)] px-4 py-3 flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
        <span>
          {s.dataQuality.fieldReportCount > 0
            ? `${s.dataQuality.fieldReportCount} field reports (${s.dataQuality.fieldReportsLast12Mo} in last 12mo)`
            : "No family field reports yet"}
        </span>
        <span>{s.dataQuality.signalCount} signals &middot; {s.dataQuality.dataCompleteness}% complete</span>
      </div>
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

/** Wraps detail content behind PaywallBlur for non-paid users */
function GatedDetails({ children }: { children: React.ReactNode }) {
  const { isPaid, loading } = useAuth()
  if (loading || isPaid) return <>{children}</>
  return <PaywallBlur>{children}</PaywallBlur>
}

function IntelSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="font-serif text-lg font-bold mb-0.5">{title}</h3>
      <p className="text-xs text-[var(--text-secondary)] mb-5">{subtitle}</p>
      {children}
    </section>
  )
}

function TimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--surface-elevated)] px-3 py-2">
      <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
      <p className="text-sm font-mono">{value}</p>
    </div>
  )
}

function SignalPill({ label, value, negative }: { label: string; value: boolean; negative?: boolean }) {
  const isGood = negative ? !value : value
  return (
    <div className="rounded-lg bg-[var(--surface-elevated)] px-3 py-2 flex items-center gap-2">
      <span className={`text-xs ${isGood ? "text-[var(--accent-green)]" : "text-[var(--score-low)]"}`}>
        {isGood ? "Yes" : "No"}
      </span>
      <span className="text-[10px] text-[var(--text-secondary)]">{label}</span>
    </div>
  )
}

function CurriculumChip({ label }: { label: string }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--accent-green)]/30 text-[var(--accent-green)]">
      {label}
    </span>
  )
}

function MemberQuote({ quote }: { quote: string }) {
  if (!quote) return null
  return (
    <div className="border-l-2 border-[var(--accent-warm)]/40 pl-3 py-1">
      <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <p className="text-[9px] text-[var(--text-secondary)]/60 mt-1">Researched estimate</p>
    </div>
  )
}

function PassportRow({ tier, examples, days, approval, friendly }: {
  tier: string; examples: string; days: number; approval: number; friendly: string
}) {
  return (
    <div className="rounded-lg bg-[var(--surface-elevated)] p-3">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-xs font-medium">{tier} passport</p>
          <p className="text-[10px] text-[var(--text-secondary)]">{examples}</p>
        </div>
      </div>
      <div className="flex gap-4 mt-2 text-xs">
        <div>
          <span className="font-mono font-bold">{days}d</span>
          <span className="text-[var(--text-secondary)] ml-1">processing</span>
        </div>
        <div>
          <span className="font-mono font-bold">{approval}%</span>
          <span className="text-[var(--text-secondary)] ml-1">approval</span>
        </div>
        <div className="text-[var(--text-secondary)]">{friendly}</div>
      </div>
    </div>
  )
}

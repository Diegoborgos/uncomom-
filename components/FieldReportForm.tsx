"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { cities } from "@/data/cities"

const TOTAL_STEPS = 6

type ReportData = {
  tripStart: string
  tripEnd: string
  kidsAges: string
  familySize: number
  safetyOverall: number
  safetyWalkingNight: string
  trafficDangerous: boolean | null
  kidsPlayedOutside: boolean | null
  schoolingApproach: string
  schoolName: string
  schoolCurriculum: string
  schoolFee: string
  schoolRating: number
  enrollmentDifficulty: string
  homeschoolExperience: string
  actualMonthlySpend: string
  housingCost: string
  housingType: string
  housingQuality: number
  costVsExpectation: string
  biggestUnexpectedCost: string
  neededDoctor: boolean | null
  doctorExperience: string
  englishPaediatrician: boolean | null
  appointmentWait: string
  outdoorRating: number
  outdoorMonths: string
  playgroundQuality: string
  foundCommunity: string
  internationalFamilies: string
  localAttitude: string
  recommendCommunity: boolean | null
  whereCommunity: string
  internetQuality: string
  couldWork: boolean | null
  topTip: string
  biggestChallenge: string
  wouldReturn: boolean | null
  overallRating: number
  // Arrival curve
  daysToHousing: string
  daysToFirstCommunity: string
  daysToSchoolEnrolled: string
  daysToOperational: string
  housingSearchDifficulty: string
  biggestSetupBlocker: string
  passportTier: string
  visaProcessingDays: string
  setupNarrative: string
  arrivalMonth: string
}

const defaultData: ReportData = {
  tripStart: "", tripEnd: "", kidsAges: "", familySize: 4,
  safetyOverall: 0, safetyWalkingNight: "", trafficDangerous: null, kidsPlayedOutside: null,
  schoolingApproach: "", schoolName: "", schoolCurriculum: "", schoolFee: "",
  schoolRating: 0, enrollmentDifficulty: "", homeschoolExperience: "",
  actualMonthlySpend: "", housingCost: "", housingType: "", housingQuality: 0,
  costVsExpectation: "", biggestUnexpectedCost: "",
  neededDoctor: null, doctorExperience: "", englishPaediatrician: null, appointmentWait: "",
  outdoorRating: 0, outdoorMonths: "", playgroundQuality: "",
  foundCommunity: "", internationalFamilies: "", localAttitude: "",
  recommendCommunity: null, whereCommunity: "",
  internetQuality: "", couldWork: null,
  topTip: "", biggestChallenge: "", wouldReturn: null, overallRating: 0,
  daysToHousing: "", daysToFirstCommunity: "", daysToSchoolEnrolled: "",
  daysToOperational: "", housingSearchDifficulty: "", biggestSetupBlocker: "",
  passportTier: "", visaProcessingDays: "", setupNarrative: "", arrivalMonth: "",
}

export default function FieldReportForm({
  citySlug,
  onComplete,
}: {
  citySlug: string
  onComplete?: () => void
}) {
  const { family } = useAuth()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<ReportData>(defaultData)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const city = cities.find((c) => c.slug === citySlug)
  const update = (fields: Partial<ReportData>) => setData({ ...data, ...fields })

  const handleSubmit = async () => {
    if (!family) return
    setSubmitting(true)

    const ages = data.kidsAges.split(",").map((a) => parseInt(a.trim())).filter((a) => !isNaN(a))
    const durationDays = data.tripStart && data.tripEnd
      ? Math.ceil((new Date(data.tripEnd).getTime() - new Date(data.tripStart).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    await supabase.from("city_field_reports").upsert({
      family_id: family.id,
      city_slug: citySlug,
      trip_start: data.tripStart,
      trip_end: data.tripEnd,
      kids_ages_during_trip: ages,
      family_size: data.familySize,
      safety_overall: data.safetyOverall || null,
      safety_walking_night: data.safetyWalkingNight || null,
      traffic_dangerous_kids: data.trafficDangerous,
      kids_played_outside_independently: data.kidsPlayedOutside,
      schooling_approach: data.schoolingApproach || null,
      school_name: data.schoolName || null,
      school_curriculum: data.schoolCurriculum || null,
      school_monthly_fee: data.schoolFee ? parseInt(data.schoolFee) : null,
      school_rating: data.schoolRating || null,
      enrollment_difficulty: data.enrollmentDifficulty || null,
      homeschool_experience: data.homeschoolExperience || null,
      actual_monthly_spend: data.actualMonthlySpend ? parseInt(data.actualMonthlySpend) : null,
      housing_cost: data.housingCost ? parseInt(data.housingCost) : null,
      housing_type: data.housingType || null,
      housing_quality: data.housingQuality || null,
      cost_vs_expectation: data.costVsExpectation || null,
      biggest_unexpected_cost: data.biggestUnexpectedCost || null,
      needed_doctor: data.neededDoctor,
      doctor_experience: data.doctorExperience || null,
      english_paediatrician_available: data.englishPaediatrician,
      appointment_wait_time: data.appointmentWait || null,
      outdoor_life_rating: data.outdoorRating || null,
      outdoor_months_comfortable: data.outdoorMonths ? parseInt(data.outdoorMonths) : null,
      playground_quality: data.playgroundQuality || null,
      found_community: data.foundCommunity || null,
      international_families_count: data.internationalFamilies || null,
      local_attitude_to_family: data.localAttitude || null,
      would_recommend_for_community: data.recommendCommunity,
      where_found_community: data.whereCommunity || null,
      internet_at_accommodation: data.internetQuality || null,
      could_work_reliably: data.couldWork,
      top_tip: data.topTip || null,
      biggest_challenge: data.biggestChallenge || null,
      would_return: data.wouldReturn,
      overall_rating: data.overallRating || null,
      stay_duration_days: durationDays,
      // Arrival curve
      days_to_housing: data.daysToHousing ? parseInt(data.daysToHousing) : null,
      days_to_first_community: data.daysToFirstCommunity ? parseInt(data.daysToFirstCommunity) : null,
      days_to_school_enrolled: data.daysToSchoolEnrolled ? parseInt(data.daysToSchoolEnrolled) : null,
      days_to_operational: data.daysToOperational ? parseInt(data.daysToOperational) : null,
      housing_search_difficulty: data.housingSearchDifficulty || null,
      biggest_setup_blocker: data.biggestSetupBlocker || null,
      passport_tier: data.passportTier || null,
      setup_narrative: data.setupNarrative || null,
      arrival_month: data.tripStart ? new Date(data.tripStart).getMonth() + 1 : null,
    }, { onConflict: "family_id,city_slug" })

    setSubmitting(false)
    setSubmitted(true)
    onComplete?.()
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/5 p-8 text-center">
        <p className="font-serif text-xl font-bold text-[var(--accent-green)] mb-2">Field report submitted</p>
        <p className="text-sm text-[var(--text-secondary)]">
          Your experience improves the FIS&trade; for every family researching {city?.name || citySlug}.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="font-serif text-lg font-bold mb-1">Family Field Report</h3>
      <p className="text-xs text-[var(--text-secondary)] mb-4">
        Step {step} of {TOTAL_STEPS} — {city?.name || citySlug}
      </p>

      {/* Progress */}
      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className={`flex-1 h-1 rounded-full ${i < step ? "bg-[var(--accent-green)]" : "bg-[var(--border)]"}`} />
        ))}
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm font-medium mb-2">Stay basics</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Arrived" type="date" value={data.tripStart} onChange={(v) => update({ tripStart: v })} />
            <Input label="Left" type="date" value={data.tripEnd} onChange={(v) => update({ tripEnd: v })} />
            <Input label="Family size" type="number" value={String(data.familySize)} onChange={(v) => update({ familySize: parseInt(v) || 4 })} />
            <Input label="Kids ages (comma sep)" value={data.kidsAges} onChange={(v) => update({ kidsAges: v })} placeholder="4, 7" />
          </div>
        </div>
      )}

      {/* Step 2: Arrival Curve — the data no other platform collects */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-serif text-lg font-bold mb-1">The arrival curve</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              This is the data no platform has. Your real timeline helps the next family land better.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Days until you had a flat/villa</label>
              <input type="number" placeholder="e.g. 14" value={data.daysToHousing}
                onChange={(e) => setData({ ...data, daysToHousing: e.target.value })}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-green)]" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Days until first real family connection</label>
              <input type="number" placeholder="e.g. 8" value={data.daysToFirstCommunity}
                onChange={(e) => setData({ ...data, daysToFirstCommunity: e.target.value })}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-green)]" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Days until kids enrolled in school</label>
              <input type="number" placeholder="e.g. 21 (0 if homeschool)" value={data.daysToSchoolEnrolled}
                onChange={(e) => setData({ ...data, daysToSchoolEnrolled: e.target.value })}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-green)]" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Weeks until you felt operational</label>
              <input type="number" placeholder="e.g. 6" value={data.daysToOperational}
                onChange={(e) => setData({ ...data, daysToOperational: e.target.value })}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-green)]" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Housing search difficulty</label>
            <select value={data.housingSearchDifficulty}
              onChange={(e) => setData({ ...data, housingSearchDifficulty: e.target.value })}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-green)]">
              <option value="">Select...</option>
              <option value="easy">Easy — found something good within a week</option>
              <option value="moderate">Moderate — took 2-3 weeks, some false starts</option>
              <option value="hard">Hard — 3-5 weeks, lost flats, felt stressful</option>
              <option value="very_hard">Very hard — 5+ weeks or had to compromise significantly</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Your passport tier</label>
            <select value={data.passportTier}
              onChange={(e) => setData({ ...data, passportTier: e.target.value })}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-green)]">
              <option value="">Select...</option>
              <option value="strong">Strong — US, UK, EU, AU, CA, JP, NZ, SG</option>
              <option value="medium">Medium — BR, MX, AR, TR, IN, ZA, MY, TH</option>
              <option value="limited">Limited — NG, GH, PK, KE, UG, and similar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Biggest setup blocker (optional)</label>
            <input type="text" placeholder="e.g. 'NIF took 3 weeks', 'school needed proof of address first'"
              value={data.biggestSetupBlocker}
              onChange={(e) => setData({ ...data, biggestSetupBlocker: e.target.value })}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-green)]" />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">
              Your setup story — week by week (optional but gold)
            </label>
            <textarea rows={3} placeholder="Week 1: SIM and Airbnb. Week 2: lost two flats. Week 3: NIF sorted. Week 5: school enrolled. Operational by week 7."
              value={data.setupNarrative}
              onChange={(e) => setData({ ...data, setupNarrative: e.target.value })}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-green)] resize-none" />
          </div>
        </div>
      )}

      {/* Step 3: Safety + Healthcare */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm font-medium mb-2">Safety & Healthcare</p>
          <StarRating label="Overall safety feeling" value={data.safetyOverall} onChange={(v) => update({ safetyOverall: v })} />
          <Select label="Safe walking at night with kids?" value={data.safetyWalkingNight} onChange={(v) => update({ safetyWalkingNight: v })} options={["Yes", "Mostly", "No"]} />
          <BoolInput label="Traffic felt dangerous for kids?" value={data.trafficDangerous} onChange={(v) => update({ trafficDangerous: v })} />
          <BoolInput label="Kids could play outside independently?" value={data.kidsPlayedOutside} onChange={(v) => update({ kidsPlayedOutside: v })} />
          <BoolInput label="Needed a doctor during stay?" value={data.neededDoctor} onChange={(v) => update({ neededDoctor: v })} />
          {data.neededDoctor && (
            <>
              <Select label="Doctor experience" value={data.doctorExperience} onChange={(v) => update({ doctorExperience: v })} options={["Excellent", "Good", "OK", "Poor"]} />
              <BoolInput label="English-speaking paediatrician available?" value={data.englishPaediatrician} onChange={(v) => update({ englishPaediatrician: v })} />
              <Select label="Appointment wait time" value={data.appointmentWait} onChange={(v) => update({ appointmentWait: v })} options={["Same day", "1-3 days", "1 week+", "Impossible"]} />
            </>
          )}
        </div>
      )}

      {/* Step 4: Education + Cost */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm font-medium mb-2">Education & Cost</p>
          <Select label="Education approach used" value={data.schoolingApproach} onChange={(v) => update({ schoolingApproach: v })} options={["International school", "Local school", "Homeschool", "Online school", "Worldschooling", "Mixed"]} />
          {data.schoolingApproach.includes("school") && (
            <>
              <Input label="School name" value={data.schoolName} onChange={(v) => update({ schoolName: v })} placeholder="e.g. CMIS" />
              <Select label="Curriculum" value={data.schoolCurriculum} onChange={(v) => update({ schoolCurriculum: v })} options={["IB", "British", "American", "Montessori", "Local", "Other"]} />
              <Input label="Monthly fee (EUR)" type="number" value={data.schoolFee} onChange={(v) => update({ schoolFee: v })} />
              <StarRating label="School quality" value={data.schoolRating} onChange={(v) => update({ schoolRating: v })} />
              <Select label="Enrollment difficulty" value={data.enrollmentDifficulty} onChange={(v) => update({ enrollmentDifficulty: v })} options={["Easy", "Moderate", "Hard", "Impossible"]} />
            </>
          )}
          <Input label="Actual monthly family spend (EUR)" type="number" value={data.actualMonthlySpend} onChange={(v) => update({ actualMonthlySpend: v })} />
          <Input label="Housing cost/month (EUR)" type="number" value={data.housingCost} onChange={(v) => update({ housingCost: v })} />
          <Select label="Housing type" value={data.housingType} onChange={(v) => update({ housingType: v })} options={["1br", "2br", "3br", "4br", "Coliving", "Other"]} />
          <StarRating label="Housing quality" value={data.housingQuality} onChange={(v) => update({ housingQuality: v })} />
          <Select label="Cost vs your expectation" value={data.costVsExpectation} onChange={(v) => update({ costVsExpectation: v })} options={["Much lower", "Lower", "As expected", "Higher", "Much higher"]} />
        </div>
      )}

      {/* Step 5: Nature + Community + Work */}
      {step === 5 && (
        <div className="space-y-4">
          <p className="text-sm font-medium mb-2">Nature, Community & Work</p>
          <StarRating label="Outdoor life for kids" value={data.outdoorRating} onChange={(v) => update({ outdoorRating: v })} />
          <Input label="Comfortable outdoor months" type="number" value={data.outdoorMonths} onChange={(v) => update({ outdoorMonths: v })} placeholder="e.g. 8" />
          <Select label="Playground quality" value={data.playgroundQuality} onChange={(v) => update({ playgroundQuality: v })} options={["Great", "OK", "Poor", "None"]} />
          <Select label="Found your community?" value={data.foundCommunity} onChange={(v) => update({ foundCommunity: v })} options={["Quickly", "Slowly", "Never"]} />
          <Select label="Other international families" value={data.internationalFamilies} onChange={(v) => update({ internationalFamilies: v })} options={["Many", "Some", "Few", "None"]} />
          <Select label="Local attitude toward your family" value={data.localAttitude} onChange={(v) => update({ localAttitude: v })} options={["Very welcoming", "Neutral", "Unwelcoming"]} />
          <Select label="Internet at accommodation" value={data.internetQuality} onChange={(v) => update({ internetQuality: v })} options={["Excellent", "Good", "Unreliable", "Unusable"]} />
          <BoolInput label="Could work reliably from here?" value={data.couldWork} onChange={(v) => update({ couldWork: v })} />
        </div>
      )}

      {/* Step 6: Open fields + Overall */}
      {step === 6 && (
        <div className="space-y-4">
          <p className="text-sm font-medium mb-2">Overall & Tips</p>
          <StarRating label="Overall rating" value={data.overallRating} onChange={(v) => update({ overallRating: v })} />
          <BoolInput label="Would you return with your family?" value={data.wouldReturn} onChange={(v) => update({ wouldReturn: v })} />
          <Textarea label="Top tip for families" value={data.topTip} onChange={(v) => update({ topTip: v })} placeholder="One thing you wish you knew before arriving" maxLength={280} />
          <Textarea label="Biggest challenge" value={data.biggestChallenge} onChange={(v) => update({ biggestChallenge: v })} placeholder="What was hardest about being here with kids?" maxLength={280} />
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="text-sm text-[var(--text-secondary)]">Back</button>
        ) : <div />}
        {step < TOTAL_STEPS ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-5 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit field report"}
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Form primitives
// ============================================================

function Input({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-secondary)] mb-1">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
      />
    </div>
  )
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-secondary)] mb-1">{label}</label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
      >
        <option value="">Select...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder, maxLength }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number
}) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-secondary)] mb-1">{label}</label>
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        maxLength={maxLength} rows={2}
        className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)] resize-none"
      />
      {maxLength && <p className="text-[10px] text-[var(--text-secondary)] text-right">{value.length}/{maxLength}</p>}
    </div>
  )
}

function StarRating({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-secondary)] mb-1">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star} type="button" onClick={() => onChange(star)}
            className={`text-xl ${star <= value ? "text-[var(--accent-warm)]" : "text-[var(--border)]"}`}
          >
            &#9733;
          </button>
        ))}
      </div>
    </div>
  )
}

function BoolInput({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-secondary)] mb-1">{label}</label>
      <div className="flex gap-2">
        <button
          type="button" onClick={() => onChange(true)}
          className={`px-4 py-1.5 rounded-lg text-xs border ${value === true ? "bg-[var(--accent-green)]/15 border-[var(--accent-green)] text-[var(--accent-green)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}
        >
          Yes
        </button>
        <button
          type="button" onClick={() => onChange(false)}
          className={`px-4 py-1.5 rounded-lg text-xs border ${value === false ? "bg-[var(--score-low)]/15 border-[var(--score-low)] text-[var(--score-low)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}
        >
          No
        </button>
      </div>
    </div>
  )
}

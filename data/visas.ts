import { VisaInfo } from "@/lib/visa-types"

export const visas: VisaInfo[] = [
  {
    id: "v1", country: "Portugal", countryCode: "PT",
    visaName: "D7 Passive Income Visa", type: "Residency",
    durationDays: 365, renewable: true, familyFriendly: true,
    costEUR: 90, processingDays: 60, incomeRequirement: 760,
    requirements: ["Proof of passive income", "Clean criminal record", "Health insurance", "Portuguese NIF"],
    notes: "One of Europe's most popular family visa routes. Leads to permanent residency after 5 years. Income requirement is per adult — add 50% for spouse, 30% per child.",
    bestFor: "Families with remote income or investments wanting a European base",
    citySlugs: ["lisbon", "porto"]
  },
  {
    id: "v2", country: "Portugal", countryCode: "PT",
    visaName: "Digital Nomad Visa (D8)", type: "Digital Nomad",
    durationDays: 365, renewable: true, familyFriendly: true,
    costEUR: 75, processingDays: 30, incomeRequirement: 3040,
    requirements: ["Employment contract or freelance income proof", "Income 4x Portuguese minimum wage", "Health insurance"],
    notes: "Newer visa option for remote workers. Higher income requirement than D7 but faster processing. Includes dependents.",
    bestFor: "Remote workers earning above €3K/month who want EU residency path",
    citySlugs: ["lisbon", "porto"]
  },
  {
    id: "v3", country: "Spain", countryCode: "ES",
    visaName: "Digital Nomad Visa (Ley de Startups)", type: "Digital Nomad",
    durationDays: 365, renewable: true, familyFriendly: true,
    costEUR: 80, processingDays: 20, incomeRequirement: 2520,
    requirements: ["Remote work for non-Spanish company", "No more than 20% income from Spanish clients", "Health insurance", "Clean criminal record"],
    notes: "Spain's new nomad visa launched 2023. Favorable tax regime (15% flat) for first 4 years. Family members included.",
    bestFor: "Families wanting Mediterranean lifestyle with tax advantages",
    citySlugs: ["valencia", "malaga", "las-palmas"]
  },
  {
    id: "v4", country: "Spain", countryCode: "ES",
    visaName: "Non-Lucrative Visa", type: "Residency",
    durationDays: 365, renewable: true, familyFriendly: true,
    costEUR: 80, processingDays: 45, incomeRequirement: 2400,
    requirements: ["Sufficient funds (€28K/year minimum)", "No work for Spanish companies", "Health insurance", "Clean criminal record"],
    notes: "Traditional route for families with savings or passive income. Cannot work for Spanish employers but remote work for foreign companies is a grey area.",
    bestFor: "Families with savings or passive income seeking Spanish residency",
    citySlugs: ["valencia", "malaga", "las-palmas"]
  },
  {
    id: "v5", country: "Georgia", countryCode: "GE",
    visaName: "Visa-Free Entry", type: "Tourist",
    durationDays: 365, renewable: false, familyFriendly: true,
    costEUR: 0, processingDays: 0, incomeRequirement: 0,
    requirements: ["Valid passport from eligible country"],
    notes: "Georgia offers visa-free stays of up to 1 year for citizens of 95+ countries. No income proof, no application. Simply arrive. One of the easiest countries in the world for families.",
    bestFor: "Families wanting a low-cost, zero-bureaucracy base for up to a year",
    citySlugs: ["tbilisi"]
  },
  {
    id: "v6", country: "Thailand", countryCode: "TH",
    visaName: "Long-Term Resident Visa (LTR)", type: "Digital Nomad",
    durationDays: 1825, renewable: true, familyFriendly: true,
    costEUR: 45, processingDays: 20, incomeRequirement: 6700,
    requirements: ["$80K/year income or $250K+ assets", "Health insurance", "Clean criminal record"],
    notes: "Thailand's premium 5-year visa for remote workers and wealthy families. 17% flat income tax. Includes dependents and fast-track immigration.",
    bestFor: "Higher-income families wanting long-term SE Asia base",
    citySlugs: ["chiang-mai"]
  },
  {
    id: "v7", country: "Thailand", countryCode: "TH",
    visaName: "Education Visa (ED)", type: "Student",
    durationDays: 365, renewable: true, familyFriendly: true,
    costEUR: 70, processingDays: 14, incomeRequirement: 0,
    requirements: ["Enrollment in Thai language school or university", "Proof of enrollment"],
    notes: "Common route for families: enroll parent in language school, children get dependent visas. Affordable and straightforward.",
    bestFor: "Families on a budget wanting to stay in Thailand long-term",
    citySlugs: ["chiang-mai"]
  },
  {
    id: "v8", country: "Indonesia", countryCode: "ID",
    visaName: "B211A Remote Worker Visa", type: "Digital Nomad",
    durationDays: 180, renewable: true, familyFriendly: true,
    costEUR: 300, processingDays: 7, incomeRequirement: 2000,
    requirements: ["Proof of remote employment", "Health insurance", "Return ticket or onward travel"],
    notes: "Bali's digital nomad visa. 6 months, extendable to 1 year. Process through a visa agent in Bali for smoothest experience.",
    bestFor: "Families wanting a semester or year in Bali",
    citySlugs: ["bali-canggu"]
  },
  {
    id: "v9", country: "Colombia", countryCode: "CO",
    visaName: "Digital Nomad Visa (V-Nómada Digital)", type: "Digital Nomad",
    durationDays: 730, renewable: false, familyFriendly: true,
    costEUR: 50, processingDays: 15, incomeRequirement: 690,
    requirements: ["Remote work contract or freelance proof", "Income 3x Colombian minimum wage", "Health insurance"],
    notes: "Colombia's 2-year nomad visa is one of the best value options in Latin America. Very low income threshold. Includes dependents.",
    bestFor: "Families on moderate income wanting a Latin American base",
    citySlugs: ["medellin", "bogota"]
  },
  {
    id: "v10", country: "Mexico", countryCode: "MX",
    visaName: "Temporary Resident Visa", type: "Residency",
    durationDays: 1460, renewable: false, familyFriendly: true,
    costEUR: 35, processingDays: 20, incomeRequirement: 2100,
    requirements: ["Proof of income or savings", "Bank statements (6 months)", "Clean criminal record"],
    notes: "4-year temporary residency with no work restrictions. Can also qualify through savings ($31K+). Tourist visa (180 days) is visa-free for most nationalities.",
    bestFor: "Families wanting a long-term Mexico base without frequent border runs",
    citySlugs: ["playa-del-carmen", "oaxaca"]
  },
  {
    id: "v11", country: "Hungary", countryCode: "HU",
    visaName: "White Card (Guest Investor)", type: "Digital Nomad",
    durationDays: 365, renewable: true, familyFriendly: true,
    costEUR: 110, processingDays: 30, incomeRequirement: 2000,
    requirements: ["Proof of remote work or business", "Health insurance", "Clean criminal record", "€250K bond (refundable)"],
    notes: "Hungary's digital nomad option requires a refundable bond but gives EU access. Schengen zone member.",
    bestFor: "Families wanting Schengen access with a Central European base",
    citySlugs: ["budapest"]
  },
  {
    id: "v12", country: "South Africa", countryCode: "ZA",
    visaName: "Visitor Visa (Remote Work)", type: "Tourist",
    durationDays: 90, renewable: true, familyFriendly: true,
    costEUR: 0, processingDays: 0, incomeRequirement: 0,
    requirements: ["Valid passport", "Return ticket", "Proof of accommodation"],
    notes: "90-day visa-free for many nationalities. South Africa doesn't have a specific nomad visa yet, but 90-day tourist stays work for shorter family stints. Extensions possible.",
    bestFor: "Families wanting a 1-3 month adventure base",
    citySlugs: ["cape-town"]
  },
  {
    id: "v13", country: "Serbia", countryCode: "RS",
    visaName: "Visa-Free Entry", type: "Tourist",
    durationDays: 90, renewable: false, familyFriendly: true,
    costEUR: 0, processingDays: 0, incomeRequirement: 0,
    requirements: ["Valid passport from eligible country"],
    notes: "90-day visa-free for most nationalities. Serbia is also working on a digital nomad visa. Easy border runs to neighboring countries reset the counter.",
    bestFor: "Families wanting an affordable European base for short stints",
    citySlugs: ["belgrade"]
  },
  {
    id: "v14", country: "Malaysia", countryCode: "MY",
    visaName: "DE Rantau (Digital Nomad Pass)", type: "Digital Nomad",
    durationDays: 365, renewable: true, familyFriendly: true,
    costEUR: 200, processingDays: 14, incomeRequirement: 2000,
    requirements: ["Remote work proof", "$24K/year income", "Health insurance", "IT/digital sector employment"],
    notes: "Malaysia's digital nomad program targets tech workers but is broadly interpreted. Includes dependents. Excellent value for families.",
    bestFor: "Tech-sector families wanting affordable Asian base with great schools",
    citySlugs: ["penang"]
  },
  {
    id: "v15", country: "Guatemala", countryCode: "GT",
    visaName: "Tourist Visa (CA-4)", type: "Tourist",
    durationDays: 90, renewable: true, familyFriendly: true,
    costEUR: 0, processingDays: 0, incomeRequirement: 0,
    requirements: ["Valid passport"],
    notes: "CA-4 agreement allows 90 days across Guatemala, Honduras, El Salvador, and Nicaragua. Easy to extend or reset. Residency options available through investment.",
    bestFor: "Families seeking short-term Central American immersion",
    citySlugs: ["antigua-guatemala"]
  },
]

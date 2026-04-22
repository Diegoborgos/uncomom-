/**
 * Human-readable descriptions for each signal key. Used by the research
 * prompt builder so Claude knows what to look up. When a signal is absent
 * from this map, the prompt falls back to the raw key — still functional,
 * but less guidance for the research agent.
 *
 * Values are 0-100 unless noted. For binary (true/false) or string
 * signals, the description makes the expected type explicit.
 */

export const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  // ============================================================
  // childSafety
  // ============================================================
  "childSafety.airQuality": "Air quality score (0=hazardous, 100=clean). Cite AQI / WHO data.",
  "childSafety.airQualityTrend": "Air quality trend over past 24 months (0=worsening, 100=improving). Cite historical AQI trend.",
  "childSafety.civilUnrestRisk": "Risk of civil unrest affecting families (0=none, 100=extreme). Cite ACLED, CIA World Factbook, or recent news.",
  "childSafety.dengueRisk": "Dengue fever risk (0=none, 100=extreme). Cite CDC travel advisories, WHO outbreak data, or national health ministry.",
  "childSafety.earthquakeRisk": "Seismic hazard rating (0=negligible, 100=extreme). Cite USGS, national geological survey, or PGA maps.",
  "childSafety.environmentalQuality": "Overall environmental quality for kids (0=toxic, 100=pristine). Cite EPI index or equivalent.",
  "childSafety.floodRisk": "Urban flood risk for residential areas (0=none, 100=extreme). Cite national flood maps or recent events.",
  "childSafety.foodSafetyRating": "Food safety for families (0=unsafe tap water, 100=excellent). Cite WHO, EU food safety, or CDC.",
  "childSafety.malariaRisk": "Malaria risk (0=none, 100=extreme). Cite CDC travel advisories or WHO.",
  "childSafety.memberAloneWithKidsRating": "How safe solo parents report feeling out with kids (0=unsafe, 100=very safe). Family-report derived — if unavailable return null.",
  "childSafety.memberKidSafetyRating": "Uncomun member rating for kid safety (0-100). Family-report derived — if unavailable return null.",
  "childSafety.memberSafetyRating": "Uncomun member general safety rating (0-100). Family-report derived — if unavailable return null.",
  "childSafety.pedestrianInfrastructure": "Pedestrian infrastructure quality for families with strollers (0=none, 100=excellent). Cite walkability index or city planning reports.",
  "childSafety.politicalStability": "Political stability (0=failed state, 100=stable democracy). Cite World Bank WGI or CIA World Factbook.",
  "childSafety.politicalStabilityTrend": "Political stability trend over past 24 months (0=deteriorating, 100=improving). Cite WGI time series or news.",
  "childSafety.streetCrime": "Street crime safety (0=extreme, 100=negligible). Cite UNODC homicide rate, national crime stats, or Numbeo Crime Index inverted.",
  "childSafety.trafficSafety": "Traffic safety for pedestrians and kids (0=dangerous, 100=very safe). Cite WHO road safety data.",
  "childSafety.uvIndex": "Average daily UV index on a 0-11+ scale. Cite WHO UV or local meteorological service.",
  "childSafety.waterQuality": "Tap water safety for families (0=unsafe, 100=potable). Cite WHO or national water authority.",

  // ============================================================
  // educationAccess
  // ============================================================
  "educationAccess.americanCurriculumAvailable": "Boolean: is an American-curriculum school available in the city?",
  "educationAccess.augustArrivalSeptemberEnrollPossible": "Boolean: can a family arriving in August enrol kids for September? Cite school admission policy examples.",
  "educationAccess.britishCurriculumAvailable": "Boolean: is a British-curriculum school available?",
  "educationAccess.englishMediumEducation": "Availability of English-medium schooling (0=none, 100=abundant). Cite ISC, COBIS, or equivalent directories.",
  "educationAccess.enrollmentDifficulty": "How hard it is to enroll mid-year (0=easy walk-in, 100=impossible). Cite admission practices.",
  "educationAccess.homeschoolLegal": "Homeschool legal status. Return one of: 'Yes' | 'Yes (grey area)' | 'Restricted' | 'No'. Cite national education ministry.",
  "educationAccess.ibAvailable": "Boolean: is at least one IB school available in the city? Cite ibo.org school directory.",
  "educationAccess.internationalSchoolCount": "Number of international schools in the metro. Cite ISC, COBIS, or Google Places.",
  "educationAccess.internationalSchoolAvgFee": "Average annual international school fee in EUR. Cite school websites or ISC Research.",
  "educationAccess.memberEnrollmentRating": "Uncomun member rating for how easy enrollment was (0-100). If unavailable return null.",
  "educationAccess.memberSchoolRating": "Uncomun member rating for school quality (0-100). If unavailable return null.",
  "educationAccess.midYearEntryPossible": "Boolean: can kids join school mid-academic-year?",
  "educationAccess.newStudentIntegrationRating": "How well new students integrate socially (0=isolated, 100=welcomed). Cite parent forums or school reports.",
  "educationAccess.onlineSchoolFriendly": "Infrastructure + legal fit for online/worldschooling (0=hostile, 100=frictionless).",
  "educationAccess.schoolCount": "Total number of schools (any type) within 10km. Cite OSM or Google Places.",
  "educationAccess.schoolQuality": "Overall school quality rating (0-100). Cite PISA, national rankings, or ISC.",
  "educationAccess.worldschoolingHubPresent": "Boolean: is the city a recognised worldschooling hub? Cite Worldschoolers FB group activity, Project World School, or similar.",

  // ============================================================
  // familyCost
  // ============================================================
  "familyCost.averageMinimumLease": "Typical minimum lease length in months for furnished 2BR. Cite local real estate portals.",
  "familyCost.childcareMonthly": "Monthly childcare cost in EUR. Cite Numbeo or local childcare websites.",
  "familyCost.costTrend": "Cost-of-living trend over past 24 months (0=increasing fast, 100=decreasing). Cite inflation statistics or Numbeo historical.",
  "familyCost.familyMonthlyEstimate": "Total monthly cost for a family of 4 in EUR (rent + school + childcare + living). Cite Numbeo, expat forums, or budget calculators.",
  "familyCost.groceryIndex": "Grocery cost index (NYC=100). Cite Numbeo Cost of Living.",
  "familyCost.housingAvailability": "Housing availability for foreigners (0=impossible, 100=abundant). Cite vacancy rates from real estate reports.",
  "familyCost.housingForeignerFriendly": "How foreigner-friendly the rental market is (0=discriminatory, 100=welcoming). Cite expat forums or Expatica.",
  "familyCost.internationalSchoolFee": "Monthly international school fee in EUR (per child). Cite school websites.",
  "familyCost.localSchoolFee": "Monthly local/private school fee in EUR. Cite school websites.",
  "familyCost.memberActualSpend": "Uncomun member median actual monthly spend in EUR. Family-report derived — if unavailable return null.",
  "familyCost.memberCostSurprise": "Whether families found costs higher or lower than expected (0=much higher, 100=much lower). If unavailable return null.",
  "familyCost.rent2br": "Monthly rent for furnished 2-bedroom apartment in EUR. Cite Numbeo, Idealista, or local portal.",
  "familyCost.restaurantIndex": "Cheap-meal restaurant price in EUR. Cite Numbeo.",
  "familyCost.transportCost": "Monthly public transport pass in EUR. Cite Numbeo or transport agency.",
  "familyCost.utilitiesMonthly": "Basic utilities monthly cost in EUR (electricity, heating, water, garbage, internet). Cite Numbeo.",

  // ============================================================
  // healthcare
  // ============================================================
  "healthcare.emergencyCareQuality": "ER / urgent care quality for families (0=dangerous, 100=world-class). Cite WHO, OECD, or hospital accreditation.",
  "healthcare.englishSpeakingDoctors": "Availability of English-speaking doctors (0=none, 100=widespread). Cite expat health guides.",
  "healthcare.englishSpeakingPaediatrician": "Boolean: are English-speaking paediatricians readily available?",
  "healthcare.hospitalCount": "Number of hospitals within 10km. Cite OSM or health ministry.",
  "healthcare.infantMortality": "Infant mortality rate per 1000 live births. Cite World Bank or national stats.",
  "healthcare.lifeExpectancy": "Life expectancy at birth in years. Cite World Bank.",
  "healthcare.memberEmergencyExperienceRating": "Uncomun member rating for emergency care experience (0-100). If unavailable return null.",
  "healthcare.memberHealthcareRating": "Uncomun member overall healthcare rating (0-100). If unavailable return null.",
  "healthcare.memberPaediatricRating": "Uncomun member paediatric care rating (0-100). If unavailable return null.",
  "healthcare.paediatricAccess": "Access to paediatric care (0=scarce, 100=abundant). Cite health ministry statistics.",
  "healthcare.paediatricEmergencyResponseTime": "Typical paediatric emergency response time in minutes. Cite EMS reports.",
  "healthcare.pharmacyAccessibility": "Pharmacy accessibility (0=scarce, 100=24/7 abundant). Cite OSM or local guides.",
  "healthcare.systemQuality": "Overall healthcare system quality (0-100). Cite WHO, OECD Health at a Glance, or Bloomberg Health Index.",
  "healthcare.vaccineAvailability": "Standard paediatric vaccine availability (0=scarce, 100=universal). Cite WHO vaccination coverage.",

  // ============================================================
  // nature
  // ============================================================
  "nature.beachAccess": "Beach accessibility from city (0=none, 100=in-city). Cite geography / tourism sources.",
  "nature.beachSafetyForKids": "Beach safety for kids (0=dangerous, 100=very safe). Cite Blue Flag certification, lifeguard coverage.",
  "nature.environmentalQuality": "Environmental Performance Index score (0-100). Cite EPI Yale.",
  "nature.hikingForKids": "Family-friendly hiking access (0=none, 100=abundant). Cite national park service or AllTrails.",
  "nature.humidityComfort": "Annual humidity comfort for families (0=oppressive, 100=ideal).",
  "nature.kidsOutdoorActivities": "Kids outdoor activity availability (0=none, 100=abundant).",
  "nature.memberOutdoorRating": "Uncomun member rating for outdoor life (0-100). If unavailable return null.",
  "nature.mountainAccess": "Mountain access within 1hr (0=none, 100=in-city).",
  "nature.natureImmersionRating": "How immersed in nature daily life feels (0=concrete jungle, 100=in nature).",
  "nature.outdoorMonthsComfortable": "Number of months per year comfortable for outdoor family activities (0-12). Cite Köppen climate data.",
  "nature.parkQuality": "Urban park quality (0=poor, 100=excellent). Cite Trust for Public Land ParkScore or equivalent.",
  "nature.parks": "Number of parks within 10km. Cite OSM.",
  "nature.playgroundQuality": "Playground quality (0=poor, 100=excellent).",
  "nature.playgrounds": "Number of playgrounds within 10km. Cite OSM.",
  "nature.sportsCentres": "Number of sports centres within 10km. Cite OSM.",
  "nature.swimmingPools": "Number of public swimming pools within 10km. Cite OSM.",

  // ============================================================
  // community
  // ============================================================
  "community.daysToFirstCommunityConnection": "Days until a new family typically makes first community connection.",
  "community.expatFamilyDensity": "Density of expat families (0=none, 100=very high). Cite InterNations, Expat.com.",
  "community.kidsActivitiesForNewcomers": "Ease of finding kids activities as a newcomer (0=impossible, 100=easy).",
  "community.kidsIntegrationSpeed": "Kids integration speed rating (0=slow, 100=fast).",
  "community.kidsIntegrationSpeedWeeks": "Weeks until kids typically feel integrated.",
  "community.libraryCount": "Number of libraries within 10km. Cite OSM.",
  "community.localFamilyAttitude": "Local attitude toward expat families (0=hostile, 100=very welcoming).",
  "community.meetupsPerMonth": "Family-oriented meetups per month. Cite Meetup.com or local FB groups.",
  "community.memberCommunityRating": "Uncomun member community rating (0-100). If unavailable return null.",
  "community.memberOnboardingRating": "Uncomun member onboarding rating (0-100). If unavailable return null.",
  "community.uncomonFamiliesBeen": "Number of Uncomun families who have visited this city. Platform-internal — return null (admin-only field).",
  "community.uncomonFamiliesNow": "Number of Uncomun families currently here. Platform-internal — return null.",
  "community.uncomonReturnRate": "Percentage of Uncomun families who return. Platform-internal — return null.",
  "community.whatsappGroupsAccessible": "Boolean: are active family WhatsApp groups accessible to newcomers?",
  "community.worldschoolingActivity": "Worldschooling community activity level (0=none, 100=hub).",

  // ============================================================
  // remoteWork
  // ============================================================
  "remoteWork.avgDownloadSpeed": "Average download speed in Mbps. Cite Ookla Speedtest Global Index or OpenSignal.",
  "remoteWork.cafeWorkFriendly": "Cafe-work friendliness (0=hostile, 100=laptop welcome). Cite expat remote-work guides.",
  "remoteWork.coworkingCount": "Number of coworking spaces. Cite OSM or Coworker.com.",
  "remoteWork.coworkingKidFriendly": "Kid-friendly coworking availability (0=none, 100=dedicated family coworking).",
  "remoteWork.internetReliability": "Internet reliability (0=constant outages, 100=rock solid). Cite World Bank ITU or OpenSignal.",
  "remoteWork.memberInternetRating": "Uncomun member internet rating (0-100). If unavailable return null.",
  "remoteWork.memberWorkSetupRating": "Uncomun member work setup rating (0-100). If unavailable return null.",
  "remoteWork.vpnFriendly": "Boolean: are VPNs legal and unrestricted?",

  // ============================================================
  // visa
  // ============================================================
  "visa.borderRunRequired": "Boolean: do families typically need border runs to stay long-term?",
  "visa.limitedPassportVisaFriendly": "Visa friendliness for limited-passport holders (0=hostile, 100=easy). Cite embassy websites.",
  "visa.mediumPassportApprovalRate": "Visa approval rate for medium-passport holders (0-100). Cite consulate statistics.",
  "visa.memberStrongPassportRating": "Uncomun strong-passport member visa rating (0-100). If unavailable return null.",
  "visa.memberVisaRating": "Uncomun member overall visa rating (0-100). If unavailable return null.",
  "visa.nomadVisaAvailable": "Boolean: does this country offer a digital nomad visa? Cite government source.",
  "visa.nomadVisaIncludesDependents": "Boolean: can dependents (spouse + kids) join on the nomad visa?",
  "visa.nomadVisaRenewable": "Boolean: is the nomad visa renewable?",
  "visa.processingDays": "Typical nomad/family visa processing time in days. Cite embassy or consulate.",
  "visa.processingDifficulty": "Processing difficulty (0=frictionless, 100=bureaucratic nightmare).",
  "visa.requiresLocalLawyer": "Boolean: do most families use a local lawyer for the visa process?",
  "visa.strongPassportApprovalRate": "Visa approval rate for strong-passport holders (0-100).",

  // ============================================================
  // lifestyle
  // ============================================================
  "lifestyle.culturalActivitiesForKids": "Cultural activities for kids (0=none, 100=abundant). Cite local museum/theatre directories.",
  "lifestyle.englishInDailyLife": "English usability in daily life (0=none, 100=universal). Cite EF English Proficiency Index.",
  "lifestyle.internationalFoodAvailability": "International food availability (0=local only, 100=every cuisine).",
  "lifestyle.kidsEntertainment": "Kids entertainment options (0=none, 100=abundant).",
  "lifestyle.memberLifestyleRating": "Uncomun member lifestyle rating (0-100). If unavailable return null.",
  "lifestyle.restaurantFamilyFriendly": "Restaurant family-friendliness (0=hostile, 100=kid menus everywhere).",

  // ============================================================
  // setupDifficulty
  // ============================================================
  "setupDifficulty.bankAccountDays": "Days to open a bank account as a foreigner.",
  "setupDifficulty.housingSetupDays": "Days to find permanent housing.",
  "setupDifficulty.firstCommunityConnectionDays": "Days until first community connection.",
  "setupDifficulty.memberSetupTimelineWeeks": "Member-reported weeks until operational. Family-report derived — if unavailable return null.",
  "setupDifficulty.nifRequired": "Boolean: is a national tax ID (NIF / tax number) required for basic services?",
  "setupDifficulty.nifDays": "Days to obtain the tax ID if required.",
}

/**
 * Fallback description for any key not listed above. Used by the
 * research prompt builder so Claude still attempts a lookup when a new
 * signal key appears.
 */
export function describeSignal(key: string): string {
  return SIGNAL_DESCRIPTIONS[key]
    ?? `${key} — research from best available public source and return the most current plausible value with a citation.`
}

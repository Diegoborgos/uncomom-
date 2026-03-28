export type HomeschoolLaw = {
  country: string
  countryCode: string
  status: "Legal" | "Legal with notification" | "Legal with restrictions" | "Grey area" | "Illegal" | "Varies by region"
  summary: string
  requirements: string
  notes: string
  popularCities: string[]
}

export const homeschoolLaws: HomeschoolLaw[] = [
  {
    country: "Portugal", countryCode: "PT", status: "Grey area",
    summary: "Homeschooling is technically legal but the process is bureaucratic and inconsistently enforced.",
    requirements: "Must register with local school and follow Portuguese curriculum. Annual assessments required.",
    notes: "Many expat families homeschool without registering. The D7 visa does not require school enrollment proof. Worldschooling families generally operate in a grey area without issues.",
    popularCities: ["lisbon", "porto", "ericeira", "nazare"],
  },
  {
    country: "Spain", countryCode: "ES", status: "Legal with restrictions",
    summary: "Education is compulsory ages 6-16. Homeschooling is not explicitly legal but is tolerated in most regions.",
    requirements: "Varies by autonomous community. Catalonia and Andalusia are most tolerant. Some regions require curriculum alignment.",
    notes: "Spain's Digital Nomad Visa does not require school enrollment. International families rarely face enforcement. Valencia and Málaga have active homeschool communities.",
    popularCities: ["valencia", "malaga", "las-palmas"],
  },
  {
    country: "Thailand", countryCode: "TH", status: "Grey area",
    summary: "Homeschooling is legal for Thai citizens with registration. Foreign families on tourist/education visas operate in a grey area.",
    requirements: "Thai citizens must register with the Ministry of Education. Foreign families are not subject to Thai education law.",
    notes: "Chiang Mai has one of the world's largest homeschool/worldschool family communities. No enforcement against foreign families.",
    popularCities: ["chiang-mai"],
  },
  {
    country: "Indonesia", countryCode: "ID", status: "Grey area",
    summary: "Homeschooling is legal for Indonesian citizens. Foreign families are not subject to Indonesian education law.",
    requirements: "Indonesian citizens must register. Foreign families operate outside the system.",
    notes: "Bali has a massive homeschool and alternative education scene. Green School and similar institutions blur the line between school and unschool.",
    popularCities: ["bali-canggu", "ubud"],
  },
  {
    country: "Georgia", countryCode: "GE", status: "Legal",
    summary: "Homeschooling is fully legal with minimal bureaucracy.",
    requirements: "Register with the Ministry of Education. No curriculum requirements for foreign families.",
    notes: "Georgia's 1-year visa-free policy makes it one of the easiest places to homeschool legally. Growing family community in Tbilisi.",
    popularCities: ["tbilisi"],
  },
  {
    country: "Colombia", countryCode: "CO", status: "Legal",
    summary: "Homeschooling is legal and constitutionally protected.",
    requirements: "No registration required. Families have full autonomy over curriculum.",
    notes: "Colombia's digital nomad visa includes dependents. Medellín and Bogotá have active homeschool co-ops.",
    popularCities: ["medellin", "bogota"],
  },
  {
    country: "Mexico", countryCode: "MX", status: "Legal",
    summary: "Homeschooling is legal. Education is compulsory but can be fulfilled at home.",
    requirements: "No formal registration. SEP (education ministry) provides free curriculum materials.",
    notes: "Mexico is one of the most homeschool-friendly countries in Latin America. Large worldschool communities in Oaxaca and Playa del Carmen.",
    popularCities: ["playa-del-carmen", "oaxaca"],
  },
  {
    country: "Hungary", countryCode: "HU", status: "Legal with restrictions",
    summary: "Homeschooling is legal but requires approval from the local government.",
    requirements: "Must apply to the local education authority. Annual exams required. Curriculum must align with national standards.",
    notes: "Budapest has several international schools as alternatives. The approval process can be lengthy for non-Hungarian speakers.",
    popularCities: ["budapest"],
  },
  {
    country: "South Africa", countryCode: "ZA", status: "Legal",
    summary: "Homeschooling is legal and well-established with a strong community.",
    requirements: "Must register with the provincial education department. Parents must have at least a matric (Grade 12) qualification.",
    notes: "South Africa has one of Africa's most developed homeschool ecosystems. Multiple curricula available including Cambridge and IEB.",
    popularCities: ["cape-town"],
  },
  {
    country: "Malaysia", countryCode: "MY", status: "Legal",
    summary: "Homeschooling is legal and growing rapidly.",
    requirements: "Must register with the Ministry of Education. Foreign families on MM2H or similar visas can homeschool freely.",
    notes: "Penang has a strong English-speaking homeschool community. Many families combine homeschool with part-time international school enrollment.",
    popularCities: ["penang"],
  },
  {
    country: "Japan", countryCode: "JP", status: "Grey area",
    summary: "School attendance is compulsory for Japanese citizens ages 6-15. Foreign residents are not legally required to attend school.",
    requirements: "Japanese citizens must enroll. Foreign families can choose to homeschool without penalty.",
    notes: "The system is strict for Japanese families but accommodating of foreigners. International schools in Kyoto and Tokyo are alternatives.",
    popularCities: ["kyoto"],
  },
  {
    country: "Romania", countryCode: "RO", status: "Legal",
    summary: "Homeschooling has been legal since 2020 with registration.",
    requirements: "Must register with the school inspectorate. Annual evaluations required.",
    notes: "A recent legal change made Romania more accessible for homeschooling families. Bucharest has growing expat interest.",
    popularCities: ["bucharest"],
  },
  {
    country: "Brazil", countryCode: "BR", status: "Legal with restrictions",
    summary: "Homeschooling was legalized in 2024 after years of legal ambiguity.",
    requirements: "Must register with the local education secretariat. Annual assessments aligned with national curriculum.",
    notes: "Implementation varies by state. Florianópolis and Porto Alegre have active alternative education communities.",
    popularCities: ["florianopolis", "porto-alegre"],
  },
  {
    country: "Costa Rica", countryCode: "CR", status: "Legal",
    summary: "Homeschooling is legal. Education is compulsory but method is flexible.",
    requirements: "No formal registration for homeschooling. MEP (education ministry) provides curriculum guidelines.",
    notes: "Santa Teresa and the Pacific coast have established surf-and-homeschool family communities.",
    popularCities: ["santa-teresa"],
  },
  {
    country: "Guatemala", countryCode: "GT", status: "Legal",
    summary: "Homeschooling is legal with minimal oversight.",
    requirements: "No registration required for foreign families. Guatemalan families must register with MINEDUC.",
    notes: "Antigua has one of Central America's strongest expat homeschool communities. Spanish immersion is a major draw.",
    popularCities: ["antigua-guatemala"],
  },
  {
    country: "Serbia", countryCode: "RS", status: "Grey area",
    summary: "Education is compulsory ages 6-15. Homeschooling is not explicitly addressed in law.",
    requirements: "No formal process exists. Foreign families typically operate outside the system.",
    notes: "Belgrade's growing digital nomad community includes homeschooling families. No known enforcement against foreign families.",
    popularCities: ["belgrade"],
  },
  {
    country: "Montenegro", countryCode: "ME", status: "Grey area",
    summary: "Similar to Serbia — compulsory education law exists but homeschooling is not addressed.",
    requirements: "No formal process. Foreign families operate without registration.",
    notes: "Kotor attracts families for short stays. No known issues with homeschooling.",
    popularCities: ["kotor"],
  },
  {
    country: "Greece", countryCode: "GR", status: "Legal with restrictions",
    summary: "Homeschooling is technically possible but requires significant bureaucratic effort.",
    requirements: "Must petition the local education authority. Approval is granted on a case-by-case basis.",
    notes: "Most island families (Lefkada etc.) homeschool informally. Enforcement is minimal outside Athens.",
    popularCities: ["lefkada"],
  },
  {
    country: "Bulgaria", countryCode: "BG", status: "Legal",
    summary: "Homeschooling (independent learning) is legal since 2016.",
    requirements: "Must register with a school that oversees the homeschooling. Annual exams required.",
    notes: "Bansko's nomad community includes many homeschooling families. Low cost makes it attractive for long stays.",
    popularCities: ["bansko"],
  },
  {
    country: "Ecuador", countryCode: "EC", status: "Legal",
    summary: "Homeschooling is legal and recognized by the Ministry of Education.",
    requirements: "Must register with the local education office. Flexible on curriculum.",
    notes: "Ecuador's low cost of living and visa-friendly policies make it attractive. Montañita is very informal.",
    popularCities: ["montanita"],
  },
  {
    country: "Bosnia and Herzegovina", countryCode: "BA", status: "Grey area",
    summary: "Education is compulsory but homeschooling is not explicitly regulated.",
    requirements: "No formal process exists for homeschooling.",
    notes: "Sarajevo has a small but growing international family presence. No enforcement against foreign families.",
    popularCities: ["sarajevo"],
  },
]

import { School } from "@/lib/school-types"

export const schools: School[] = [
  // Lisbon
  {
    id: "s1", name: "St. Julian's School", citySlug: "lisbon",
    type: "International", curriculum: "British", ageRange: "3-18",
    monthlyFee: 800, language: ["English", "Portuguese"],
    rating: 0, familyReviews: 0, website: "https://stjulians.com",
    description: "One of the oldest international schools in Portugal. Strong British curriculum with IB diploma option in senior years.",
    tags: ["established", "IB option", "sports"]
  },
  {
    id: "s2", name: "Carlucci American International School", citySlug: "lisbon",
    type: "International", curriculum: "American", ageRange: "3-18",
    monthlyFee: 900, language: ["English"],
    rating: 0, familyReviews: 0, website: "https://caislisbon.org",
    description: "American curriculum school with AP courses. Strong arts and athletics programs. Diverse international student body.",
    tags: ["AP courses", "diverse", "arts"]
  },
  // Bali
  {
    id: "s3", name: "Green School Bali", citySlug: "bali-canggu",
    type: "International", curriculum: "IB", ageRange: "3-18",
    monthlyFee: 1200, language: ["English"],
    rating: 0, familyReviews: 0, website: "https://greenschool.org",
    description: "World-famous bamboo campus school focused on sustainability and entrepreneurship. The school that put Bali on the map for families.",
    tags: ["sustainability", "bamboo campus", "entrepreneurship", "nature"]
  },
  {
    id: "s4", name: "Bali Island School", citySlug: "bali-canggu",
    type: "International", curriculum: "IB", ageRange: "2-18",
    monthlyFee: 700, language: ["English", "Indonesian"],
    rating: 0, familyReviews: 0, website: "https://baliislandschool.com",
    description: "IB World School with a strong community feel. More affordable than Green School with excellent academic results.",
    tags: ["IB", "community", "affordable"]
  },
  // Chiang Mai
  {
    id: "s5", name: "Prem Tinsulanonda International School", citySlug: "chiang-mai",
    type: "International", curriculum: "IB", ageRange: "3-18",
    monthlyFee: 500, language: ["English", "Thai"],
    rating: 0, familyReviews: 0, website: "https://ptis.ac.th",
    description: "Full IB school set on a stunning mountain campus. Boarding and day options. Strong outdoor education program.",
    tags: ["IB", "boarding", "mountain campus", "outdoor education"]
  },
  {
    id: "s6", name: "CMIS (Chiang Mai International School)", citySlug: "chiang-mai",
    type: "International", curriculum: "American", ageRange: "2-18",
    monthlyFee: 400, language: ["English"],
    rating: 0, familyReviews: 0, website: "https://cmis.ac.th",
    description: "American-style curriculum in a nurturing environment. Popular with expat families for its welcoming community and reasonable fees.",
    tags: ["American", "welcoming", "affordable"]
  },
  // Valencia
  {
    id: "s7", name: "The British School of Valencia", citySlug: "valencia",
    type: "International", curriculum: "British", ageRange: "3-18",
    monthlyFee: 650, language: ["English", "Spanish"],
    rating: 0, familyReviews: 0, website: "https://bsvalencia.com",
    description: "British curriculum with strong bilingual program. Excellent sports facilities and a well-connected parent community.",
    tags: ["British", "bilingual", "sports"]
  },
  {
    id: "s8", name: "Caxton College", citySlug: "valencia",
    type: "International", curriculum: "British", ageRange: "2-18",
    monthlyFee: 600, language: ["English", "Spanish", "Valencian"],
    rating: 0, familyReviews: 0, website: "https://caxtoncollege.com",
    description: "One of Spain's top-rated British schools. Trilingual environment with outstanding university placement record.",
    tags: ["trilingual", "top-rated", "university prep"]
  },
  // Medellín
  {
    id: "s9", name: "Colegio Columbus School", citySlug: "medellin",
    type: "International", curriculum: "American", ageRange: "3-18",
    monthlyFee: 500, language: ["English", "Spanish"],
    rating: 0, familyReviews: 0, website: "https://columbus.edu.co",
    description: "American curriculum school with full bilingual program. Strong STEM focus and active parent community.",
    tags: ["bilingual", "STEM", "American"]
  },
  // Cape Town
  {
    id: "s10", name: "American International School of Cape Town", citySlug: "cape-town",
    type: "International", curriculum: "American", ageRange: "3-18",
    monthlyFee: 600, language: ["English"],
    rating: 0, familyReviews: 0, website: "https://aisct.org",
    description: "AP and IB options in a diverse, globally-minded environment. Beautiful campus with mountain views.",
    tags: ["AP", "IB option", "diverse", "mountain views"]
  },
  // Budapest
  {
    id: "s11", name: "Budapest British International School", citySlug: "budapest",
    type: "International", curriculum: "British", ageRange: "3-18",
    monthlyFee: 550, language: ["English", "Hungarian"],
    rating: 0, familyReviews: 0, website: "https://bbis.hu",
    description: "Well-established British school with strong pastoral care. Central location and active after-school program.",
    tags: ["British", "central", "pastoral care"]
  },
  // Penang
  {
    id: "s12", name: "Dalat International School", citySlug: "penang",
    type: "International", curriculum: "American", ageRange: "3-18",
    monthlyFee: 450, language: ["English"],
    rating: 0, familyReviews: 0, website: "https://dalat.org",
    description: "Top-rated international school in Penang with American curriculum. Hillside campus with excellent facilities.",
    tags: ["American", "top-rated", "hillside campus"]
  },
  // Málaga
  {
    id: "s13", name: "The British College of Málaga", citySlug: "malaga",
    type: "International", curriculum: "British", ageRange: "3-18",
    monthlyFee: 550, language: ["English", "Spanish"],
    rating: 0, familyReviews: 0, website: "https://bcmalaga.com",
    description: "British curriculum on the Costa del Sol. Small class sizes, strong arts program, and a tight-knit family community.",
    tags: ["British", "small classes", "arts"]
  },
  // Las Palmas
  {
    id: "s14", name: "Canterbury School Las Palmas", citySlug: "las-palmas",
    type: "International", curriculum: "British", ageRange: "3-18",
    monthlyFee: 500, language: ["English", "Spanish"],
    rating: 0, familyReviews: 0, website: "https://canterburyschool.es",
    description: "British school serving the international community in Gran Canaria. Good balance of academics and island lifestyle.",
    tags: ["British", "island life", "bilingual"]
  },
  // Kyoto
  {
    id: "s15", name: "Kyoto International School", citySlug: "kyoto",
    type: "International", curriculum: "IB", ageRange: "3-11",
    monthlyFee: 850, language: ["English", "Japanese"],
    rating: 0, familyReviews: 0, website: "https://kis.ac.jp",
    description: "Small, nurturing IB Primary Years Programme school. Deeply integrated with Japanese culture while maintaining international standards.",
    tags: ["IB PYP", "small", "cultural immersion"]
  },
]

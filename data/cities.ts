import { City } from "@/lib/types"

export const cities: City[] = [
  {
    id: "1",
    slug: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    countryCode: "PT",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&h=500&fit=crop",
    coords: { lat: 38.7223, lng: -9.1393 },
    scores: { family: 88, childSafety: 85, schoolAccess: 82, nature: 75, internet: 80, healthcare: 78 },
    cost: { familyMonthly: 3200, rent2br: 1600, internationalSchool: 600, localSchool: 0, childcare: 400 },
    meta: {
      familiesNow: 34, familiesBeen: 420, returnRate: 72,
      bestMonths: ["March", "April", "May", "September", "October"],
      timezone: "Europe/Lisbon", language: ["Portuguese", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "Excellent", kidsAgeIdeal: "All ages"
    },
    tags: ["beach", "surf", "expat community", "international schools", "safe", "warm", "mediterranean"],
    description: "Lisbon is the undisputed capital of family-friendly slow travel in Europe. Affordable by Western European standards, safe, with world-class international schools and a massive expat family community."
  },
  {
    id: "2",
    slug: "chiang-mai",
    name: "Chiang Mai",
    country: "Thailand",
    countryCode: "TH",
    continent: "Asia",
    photo: "https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=800&h=500&fit=crop",
    coords: { lat: 18.7883, lng: 98.9853 },
    scores: { family: 82, childSafety: 78, schoolAccess: 75, nature: 85, internet: 82, healthcare: 72 },
    cost: { familyMonthly: 1800, rent2br: 600, internationalSchool: 400, localSchool: 50, childcare: 200 },
    meta: {
      familiesNow: 28, familiesBeen: 380, returnRate: 65,
      bestMonths: ["November", "December", "January", "February"],
      timezone: "Asia/Bangkok", language: ["Thai", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["nature", "low cost", "expat community", "warm", "tropical", "mountains"],
    description: "Chiang Mai offers an unbeatable combination of low cost, warm community, and stunning nature. The international school scene is growing fast, and the homeschool family network is one of the strongest in Asia."
  },
  {
    id: "3",
    slug: "bali-canggu",
    name: "Bali (Canggu)",
    country: "Indonesia",
    countryCode: "ID",
    continent: "Asia",
    photo: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=500&fit=crop",
    coords: { lat: -8.6478, lng: 115.1385 },
    scores: { family: 84, childSafety: 70, schoolAccess: 80, nature: 90, internet: 72, healthcare: 62 },
    cost: { familyMonthly: 2800, rent2br: 1000, internationalSchool: 700, localSchool: 100, childcare: 200 },
    meta: {
      familiesNow: 38, familiesBeen: 510, returnRate: 70,
      bestMonths: ["April", "May", "June", "July", "August", "September"],
      timezone: "Asia/Makassar", language: ["Indonesian", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["surf", "nature", "beach", "expat community", "international schools", "tropical", "warm"],
    description: "Canggu is the global hub for traveling families. World-class international schools like Green School, an enormous expat parent community, and surf culture that kids of all ages thrive in."
  },
  {
    id: "4",
    slug: "valencia",
    name: "Valencia",
    country: "Spain",
    countryCode: "ES",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1599725728079-5765f7eef93a?w=800&h=500&fit=crop",
    coords: { lat: 39.4699, lng: -0.3763 },
    scores: { family: 90, childSafety: 88, schoolAccess: 85, nature: 78, internet: 82, healthcare: 85 },
    cost: { familyMonthly: 3000, rent2br: 1200, internationalSchool: 550, localSchool: 0, childcare: 350 },
    meta: {
      familiesNow: 30, familiesBeen: 390, returnRate: 75,
      bestMonths: ["March", "April", "May", "September", "October"],
      timezone: "Europe/Madrid", language: ["Spanish", "Valencian", "English"],
      homeschoolLegal: "Restricted", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["beach", "safe", "international schools", "mediterranean", "nature"],
    description: "Valencia consistently ranks as the best city for families in Spain. Exceptional public parks, the City of Arts and Sciences, beach access, and a cost of living well below Barcelona or Madrid."
  },
  {
    id: "5",
    slug: "medellin",
    name: "Medellín",
    country: "Colombia",
    countryCode: "CO",
    continent: "Latin America",
    photo: "https://images.unsplash.com/photo-1599708153386-62da498afa1f?w=800&h=500&fit=crop",
    coords: { lat: 6.2476, lng: -75.5658 },
    scores: { family: 79, childSafety: 65, schoolAccess: 72, nature: 80, internet: 75, healthcare: 74 },
    cost: { familyMonthly: 2200, rent2br: 800, internationalSchool: 500, localSchool: 100, childcare: 250 },
    meta: {
      familiesNow: 22, familiesBeen: 290, returnRate: 58,
      bestMonths: ["December", "January", "February", "March"],
      timezone: "America/Bogota", language: ["Spanish", "English"],
      homeschoolLegal: "Yes", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["nature", "mountains", "expat community", "warm", "low cost"],
    description: "Medellín's eternal spring climate and dramatically lower cost of living make it a magnet for families seeking a Latin American base. The city has transformed and now hosts a thriving international family community."
  },
  {
    id: "6",
    slug: "tbilisi",
    name: "Tbilisi",
    country: "Georgia",
    countryCode: "GE",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&h=500&fit=crop",
    coords: { lat: 41.7151, lng: 44.8271 },
    scores: { family: 76, childSafety: 80, schoolAccess: 65, nature: 78, internet: 75, healthcare: 60 },
    cost: { familyMonthly: 1600, rent2br: 550, internationalSchool: 350, localSchool: 0, childcare: 150 },
    meta: {
      familiesNow: 15, familiesBeen: 180, returnRate: 55,
      bestMonths: ["May", "June", "September", "October"],
      timezone: "Asia/Tbilisi", language: ["Georgian", "English", "Russian"],
      homeschoolLegal: "Yes", visaFriendly: "Excellent", kidsAgeIdeal: "All ages"
    },
    tags: ["low cost", "safe", "nature", "mountains", "expat community", "variable"],
    description: "Tbilisi is one of the most underrated family bases in the world. Visa-free for a year, incredibly affordable, safe, and with a growing community of location-independent families discovering its charm."
  },
  {
    id: "7",
    slug: "playa-del-carmen",
    name: "Playa del Carmen",
    country: "Mexico",
    countryCode: "MX",
    continent: "Latin America",
    photo: "https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800&h=500&fit=crop",
    coords: { lat: 20.6296, lng: -87.0739 },
    scores: { family: 78, childSafety: 62, schoolAccess: 70, nature: 82, internet: 72, healthcare: 68 },
    cost: { familyMonthly: 2600, rent2br: 1100, internationalSchool: 500, localSchool: 80, childcare: 250 },
    meta: {
      familiesNow: 25, familiesBeen: 340, returnRate: 60,
      bestMonths: ["November", "December", "January", "February", "March"],
      timezone: "America/Cancun", language: ["Spanish", "English"],
      homeschoolLegal: "Yes", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["beach", "nature", "expat community", "warm", "tropical"],
    description: "Playa del Carmen combines Caribbean beach life with a well-established expat infrastructure. Easy US timezone overlap, strong bilingual school options, and a lively family scene year-round."
  },
  {
    id: "8",
    slug: "porto",
    name: "Porto",
    country: "Portugal",
    countryCode: "PT",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=500&fit=crop",
    coords: { lat: 41.1579, lng: -8.6291 },
    scores: { family: 83, childSafety: 86, schoolAccess: 75, nature: 80, internet: 78, healthcare: 76 },
    cost: { familyMonthly: 2800, rent2br: 1300, internationalSchool: 550, localSchool: 0, childcare: 350 },
    meta: {
      familiesNow: 18, familiesBeen: 250, returnRate: 68,
      bestMonths: ["May", "June", "September", "October"],
      timezone: "Europe/Lisbon", language: ["Portuguese", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "Excellent", kidsAgeIdeal: "All ages"
    },
    tags: ["surf", "nature", "safe", "expat community", "beach", "mediterranean"],
    description: "Porto offers a quieter, more intimate alternative to Lisbon with the same visa advantages. Stunning riverfront, excellent food, and a growing family community drawn by the surf coast nearby."
  },
  {
    id: "9",
    slug: "budapest",
    name: "Budapest",
    country: "Hungary",
    countryCode: "HU",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=800&h=500&fit=crop",
    coords: { lat: 47.4979, lng: 19.0402 },
    scores: { family: 77, childSafety: 82, schoolAccess: 78, nature: 68, internet: 85, healthcare: 75 },
    cost: { familyMonthly: 2400, rent2br: 1000, internationalSchool: 500, localSchool: 0, childcare: 300 },
    meta: {
      familiesNow: 16, familiesBeen: 210, returnRate: 52,
      bestMonths: ["April", "May", "June", "September"],
      timezone: "Europe/Budapest", language: ["Hungarian", "English"],
      homeschoolLegal: "Restricted", visaFriendly: "OK", kidsAgeIdeal: "All ages"
    },
    tags: ["safe", "international schools", "expat community", "variable"],
    description: "Budapest is a cultural powerhouse with affordable international schools and one of the best public transport systems in Europe. Thermal baths, ruin bars for the parents, and a deeply kid-friendly culture."
  },
  {
    id: "10",
    slug: "oaxaca",
    name: "Oaxaca",
    country: "Mexico",
    countryCode: "MX",
    continent: "Latin America",
    photo: "https://images.unsplash.com/photo-1578974742841-30eb7e8ef129?w=800&h=500&fit=crop",
    coords: { lat: 17.0732, lng: -96.7266 },
    scores: { family: 74, childSafety: 68, schoolAccess: 60, nature: 82, internet: 65, healthcare: 60 },
    cost: { familyMonthly: 1800, rent2br: 650, internationalSchool: 350, localSchool: 50, childcare: 150 },
    meta: {
      familiesNow: 12, familiesBeen: 160, returnRate: 55,
      bestMonths: ["October", "November", "December", "January", "February"],
      timezone: "America/Mexico_City", language: ["Spanish", "English"],
      homeschoolLegal: "Yes", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["nature", "low cost", "mountains", "warm"],
    description: "Oaxaca is magic for families who want deep cultural immersion on a budget. The food, art, and indigenous traditions create an education money can't buy. The homeschool family community is tight-knit."
  },
  {
    id: "11",
    slug: "cape-town",
    name: "Cape Town",
    country: "South Africa",
    countryCode: "ZA",
    continent: "Africa",
    photo: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&h=500&fit=crop",
    coords: { lat: -33.9249, lng: 18.4241 },
    scores: { family: 80, childSafety: 55, schoolAccess: 78, nature: 95, internet: 75, healthcare: 70 },
    cost: { familyMonthly: 2500, rent2br: 1000, internationalSchool: 500, localSchool: 150, childcare: 250 },
    meta: {
      familiesNow: 20, familiesBeen: 270, returnRate: 62,
      bestMonths: ["October", "November", "December", "January", "February", "March"],
      timezone: "Africa/Johannesburg", language: ["English", "Afrikaans", "Xhosa"],
      homeschoolLegal: "Yes", visaFriendly: "OK", kidsAgeIdeal: "All ages"
    },
    tags: ["nature", "beach", "mountains", "surf", "warm"],
    description: "Cape Town is a nature playground like nowhere else. Table Mountain, penguins, whale watching, and some of the best beaches in the world — all wrapped in a surprisingly affordable family lifestyle."
  },
  {
    id: "12",
    slug: "penang",
    name: "Penang",
    country: "Malaysia",
    countryCode: "MY",
    continent: "Asia",
    photo: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&h=500&fit=crop",
    coords: { lat: 5.4164, lng: 100.3327 },
    scores: { family: 81, childSafety: 78, schoolAccess: 80, nature: 72, internet: 78, healthcare: 75 },
    cost: { familyMonthly: 1900, rent2br: 550, internationalSchool: 450, localSchool: 50, childcare: 180 },
    meta: {
      familiesNow: 18, familiesBeen: 230, returnRate: 64,
      bestMonths: ["December", "January", "February", "March"],
      timezone: "Asia/Kuala_Lumpur", language: ["Malay", "English", "Mandarin"],
      homeschoolLegal: "Yes", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["low cost", "beach", "safe", "international schools", "tropical", "warm"],
    description: "Penang is Southeast Asia's best-kept secret for families. Incredible food, strong international schools, English widely spoken, and a cost of living that lets you live well on a modest budget."
  },
  {
    id: "13",
    slug: "malaga",
    name: "Málaga",
    country: "Spain",
    countryCode: "ES",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1592571689539-a3e479f71a63?w=800&h=500&fit=crop",
    coords: { lat: 36.7213, lng: -4.4217 },
    scores: { family: 86, childSafety: 85, schoolAccess: 80, nature: 78, internet: 80, healthcare: 82 },
    cost: { familyMonthly: 2900, rent2br: 1200, internationalSchool: 500, localSchool: 0, childcare: 350 },
    meta: {
      familiesNow: 24, familiesBeen: 310, returnRate: 70,
      bestMonths: ["March", "April", "May", "October", "November"],
      timezone: "Europe/Madrid", language: ["Spanish", "English"],
      homeschoolLegal: "Restricted", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["beach", "safe", "warm", "international schools", "mediterranean"],
    description: "Málaga has emerged as one of Europe's top family destinations. 300 days of sunshine, a walkable historic centre, excellent healthcare, and a booming international school ecosystem along the Costa del Sol."
  },
  {
    id: "14",
    slug: "bucharest",
    name: "Bucharest",
    country: "Romania",
    countryCode: "RO",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=800&h=500&fit=crop",
    coords: { lat: 44.4268, lng: 26.1025 },
    scores: { family: 71, childSafety: 78, schoolAccess: 72, nature: 55, internet: 88, healthcare: 65 },
    cost: { familyMonthly: 2100, rent2br: 800, internationalSchool: 500, localSchool: 0, childcare: 250 },
    meta: {
      familiesNow: 10, familiesBeen: 140, returnRate: 42,
      bestMonths: ["May", "June", "September"],
      timezone: "Europe/Bucharest", language: ["Romanian", "English"],
      homeschoolLegal: "Yes", visaFriendly: "OK", kidsAgeIdeal: "Teens"
    },
    tags: ["low cost", "safe", "variable"],
    description: "Bucharest flies under the radar but delivers fast internet, low costs, and excellent access to nature in the nearby Carpathian mountains. A practical base for families who prioritise connectivity."
  },
  {
    id: "15",
    slug: "bogota",
    name: "Bogotá",
    country: "Colombia",
    countryCode: "CO",
    continent: "Latin America",
    photo: "https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?w=800&h=500&fit=crop",
    coords: { lat: 4.711, lng: -74.0721 },
    scores: { family: 72, childSafety: 60, schoolAccess: 75, nature: 65, internet: 78, healthcare: 72 },
    cost: { familyMonthly: 2100, rent2br: 750, internationalSchool: 500, localSchool: 80, childcare: 200 },
    meta: {
      familiesNow: 14, familiesBeen: 190, returnRate: 48,
      bestMonths: ["December", "January", "February", "March"],
      timezone: "America/Bogota", language: ["Spanish", "English"],
      homeschoolLegal: "Yes", visaFriendly: "Good", kidsAgeIdeal: "Teens"
    },
    tags: ["mountains", "expat community", "international schools", "variable"],
    description: "Bogotá offers big-city energy with excellent international schools and a cosmopolitan culture. The altitude keeps it cool, the museums are world-class, and the cost of living stretches far."
  },
  {
    id: "16",
    slug: "kyoto",
    name: "Kyoto",
    country: "Japan",
    countryCode: "JP",
    continent: "Asia",
    photo: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=500&fit=crop",
    coords: { lat: 35.0116, lng: 135.7681 },
    scores: { family: 85, childSafety: 95, schoolAccess: 70, nature: 82, internet: 88, healthcare: 90 },
    cost: { familyMonthly: 3500, rent2br: 1400, internationalSchool: 800, localSchool: 0, childcare: 400 },
    meta: {
      familiesNow: 12, familiesBeen: 170, returnRate: 60,
      bestMonths: ["March", "April", "October", "November"],
      timezone: "Asia/Tokyo", language: ["Japanese"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "OK", kidsAgeIdeal: "All ages"
    },
    tags: ["safe", "nature", "mountains", "variable"],
    description: "Kyoto is one of the safest cities on earth for children. Temples, forests, and a deep cultural rhythm that families find grounding. The language barrier is real, but the quality of life is extraordinary."
  },
  {
    id: "17",
    slug: "florianopolis",
    name: "Florianópolis",
    country: "Brazil",
    countryCode: "BR",
    continent: "Latin America",
    photo: "https://images.unsplash.com/photo-1588001832198-c15cff59b078?w=800&h=500&fit=crop",
    coords: { lat: -27.5954, lng: -48.548 },
    scores: { family: 77, childSafety: 65, schoolAccess: 68, nature: 90, internet: 70, healthcare: 68 },
    cost: { familyMonthly: 2200, rent2br: 850, internationalSchool: 450, localSchool: 50, childcare: 200 },
    meta: {
      familiesNow: 16, familiesBeen: 200, returnRate: 58,
      bestMonths: ["December", "January", "February", "March"],
      timezone: "America/Sao_Paulo", language: ["Portuguese", "English"],
      homeschoolLegal: "Restricted", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["beach", "surf", "nature", "warm", "tropical"],
    description: "Florianópolis is Brazil's island paradise — 42 beaches, a laid-back surf culture, and a growing tech scene bringing international families south. The nature is world-class and kids live outdoors."
  },
  {
    id: "18",
    slug: "las-palmas",
    name: "Las Palmas",
    country: "Spain",
    countryCode: "ES",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1574788722698-8f3acf93f830?w=800&h=500&fit=crop",
    coords: { lat: 28.1235, lng: -15.4363 },
    scores: { family: 84, childSafety: 84, schoolAccess: 76, nature: 80, internet: 82, healthcare: 80 },
    cost: { familyMonthly: 2700, rent2br: 1100, internationalSchool: 500, localSchool: 0, childcare: 300 },
    meta: {
      familiesNow: 22, familiesBeen: 280, returnRate: 66,
      bestMonths: ["October", "November", "December", "January", "February", "March"],
      timezone: "Atlantic/Canary", language: ["Spanish", "English"],
      homeschoolLegal: "Restricted", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["beach", "surf", "warm", "safe", "expat community", "mediterranean"],
    description: "Las Palmas offers year-round spring weather, a massive nomad and family community, and EU infrastructure on an island off the coast of Africa. The surf, the food, and the lifestyle are hard to beat."
  },
  {
    id: "19",
    slug: "antigua-guatemala",
    name: "Antigua Guatemala",
    country: "Guatemala",
    countryCode: "GT",
    continent: "Latin America",
    photo: "https://images.unsplash.com/photo-1604156788856-2ce5f2171e32?w=800&h=500&fit=crop",
    coords: { lat: 14.5586, lng: -90.7295 },
    scores: { family: 72, childSafety: 60, schoolAccess: 62, nature: 85, internet: 62, healthcare: 55 },
    cost: { familyMonthly: 1700, rent2br: 600, internationalSchool: 350, localSchool: 40, childcare: 120 },
    meta: {
      familiesNow: 10, familiesBeen: 130, returnRate: 50,
      bestMonths: ["November", "December", "January", "February", "March"],
      timezone: "America/Guatemala", language: ["Spanish", "English"],
      homeschoolLegal: "Yes", visaFriendly: "Good", kidsAgeIdeal: "Young children"
    },
    tags: ["mountains", "low cost", "nature", "warm", "expat community"],
    description: "Antigua is a colonial gem surrounded by volcanoes with one of Central America's strongest expat family communities. Spanish immersion is effortless, costs are minimal, and the pace of life is slow."
  },
  {
    id: "20",
    slug: "belgrade",
    name: "Belgrade",
    country: "Serbia",
    countryCode: "RS",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1580402427914-a6cc60d7adb5?w=800&h=500&fit=crop",
    coords: { lat: 44.7866, lng: 20.4489 },
    scores: { family: 74, childSafety: 78, schoolAccess: 72, nature: 60, internet: 82, healthcare: 68 },
    cost: { familyMonthly: 2000, rent2br: 750, internationalSchool: 450, localSchool: 0, childcare: 220 },
    meta: {
      familiesNow: 11, familiesBeen: 150, returnRate: 45,
      bestMonths: ["May", "June", "September", "October"],
      timezone: "Europe/Belgrade", language: ["Serbian", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "Good", kidsAgeIdeal: "Teens"
    },
    tags: ["low cost", "safe", "expat community", "variable"],
    description: "Belgrade is an underpriced European capital with fast internet, a thriving cafe culture, and a surprisingly family-friendly vibe. The riverfront parks and fortress playground are daily staples for local families."
  }
]

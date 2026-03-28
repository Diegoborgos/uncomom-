import { City } from "@/lib/types"

export const cities: City[] = [
  {
    id: "1",
    slug: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    countryCode: "PT",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1513735492246-483525079686?w=800&h=500&fit=crop",
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
    photo: "https://images.unsplash.com/photo-1505832018823-50331d70d237?w=800&h=500&fit=crop",
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
    photo: "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=500&fit=crop",
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
  },
  {
    id: "21",
    slug: "ubud",
    name: "Ubud",
    country: "Indonesia",
    countryCode: "ID",
    continent: "Asia",
    photo: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800&h=500&fit=crop",
    coords: { lat: -8.5069, lng: 115.2625 },
    scores: { family: 81, childSafety: 68, schoolAccess: 75, nature: 95, internet: 68, healthcare: 58 },
    cost: { familyMonthly: 2400, rent2br: 800, internationalSchool: 600, localSchool: 80, childcare: 180 },
    meta: {
      familiesNow: 26, familiesBeen: 340, returnRate: 65,
      bestMonths: ["April", "May", "June", "July", "August", "September"],
      timezone: "Asia/Makassar", language: ["Indonesian", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["nature", "mountains", "expat community", "tropical", "warm"],
    description: "Ubud is Bali's spiritual and artistic heart. Surrounded by rice terraces and jungle, it attracts families seeking a slower pace than Canggu with deep wellness and homeschool communities."
  },
  {
    id: "22",
    slug: "sarajevo",
    name: "Sarajevo",
    country: "Bosnia and Herzegovina",
    countryCode: "BA",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1590080876067-45ced9a42e63?w=800&h=500&fit=crop",
    coords: { lat: 43.8563, lng: 18.4131 },
    scores: { family: 70, childSafety: 75, schoolAccess: 60, nature: 78, internet: 72, healthcare: 60 },
    cost: { familyMonthly: 1500, rent2br: 500, internationalSchool: 300, localSchool: 0, childcare: 150 },
    meta: {
      familiesNow: 7, familiesBeen: 90, returnRate: 40,
      bestMonths: ["May", "June", "September", "October"],
      timezone: "Europe/Sarajevo", language: ["Bosnian", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "Good", kidsAgeIdeal: "Teens"
    },
    tags: ["low cost", "mountains", "safe", "nature", "variable"],
    description: "Sarajevo is one of Europe's most affordable capitals with a rich cultural tapestry. The surrounding mountains offer year-round outdoor activities, and the city's warmth surprises every family that visits."
  },
  {
    id: "23",
    slug: "bansko",
    name: "Bansko",
    country: "Bulgaria",
    countryCode: "BG",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=500&fit=crop",
    coords: { lat: 41.8366, lng: 23.4884 },
    scores: { family: 73, childSafety: 80, schoolAccess: 55, nature: 85, internet: 80, healthcare: 58 },
    cost: { familyMonthly: 1400, rent2br: 450, internationalSchool: 250, localSchool: 0, childcare: 120 },
    meta: {
      familiesNow: 14, familiesBeen: 170, returnRate: 52,
      bestMonths: ["June", "July", "August", "September", "December", "January", "February"],
      timezone: "Europe/Sofia", language: ["Bulgarian", "English"],
      homeschoolLegal: "Yes", visaFriendly: "OK", kidsAgeIdeal: "All ages"
    },
    tags: ["mountains", "low cost", "safe", "nature", "expat community", "variable"],
    description: "Bansko is a small mountain town that has become a surprise digital nomad hub. Skiing in winter, hiking in summer, and rock-bottom costs make it a practical family base in the EU."
  },
  {
    id: "24",
    slug: "nazare",
    name: "Nazaré",
    country: "Portugal",
    countryCode: "PT",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop",
    coords: { lat: 39.6010, lng: -9.0714 },
    scores: { family: 75, childSafety: 85, schoolAccess: 55, nature: 88, internet: 70, healthcare: 72 },
    cost: { familyMonthly: 2200, rent2br: 900, internationalSchool: 450, localSchool: 0, childcare: 250 },
    meta: {
      familiesNow: 8, familiesBeen: 95, returnRate: 55,
      bestMonths: ["May", "June", "July", "August", "September"],
      timezone: "Europe/Lisbon", language: ["Portuguese", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "Excellent", kidsAgeIdeal: "All ages"
    },
    tags: ["surf", "beach", "nature", "safe", "mediterranean"],
    description: "Nazaré is famous for its giant waves but the town itself is a quiet, family-safe beach village. A growing surf family community and proximity to Lisbon make it an appealing base."
  },
  {
    id: "25",
    slug: "porto-alegre",
    name: "Porto Alegre",
    country: "Brazil",
    countryCode: "BR",
    continent: "Latin America",
    photo: "https://images.unsplash.com/photo-1544989164-31dc3291c398?w=800&h=500&fit=crop",
    coords: { lat: -30.0346, lng: -51.2177 },
    scores: { family: 68, childSafety: 55, schoolAccess: 70, nature: 65, internet: 72, healthcare: 68 },
    cost: { familyMonthly: 1800, rent2br: 600, internationalSchool: 400, localSchool: 60, childcare: 180 },
    meta: {
      familiesNow: 8, familiesBeen: 100, returnRate: 38,
      bestMonths: ["March", "April", "October", "November"],
      timezone: "America/Sao_Paulo", language: ["Portuguese", "English"],
      homeschoolLegal: "Restricted", visaFriendly: "Good", kidsAgeIdeal: "Teens"
    },
    tags: ["low cost", "nature", "variable"],
    description: "Porto Alegre is southern Brazil's cultural capital with a European feel, strong schools, and a lower cost of living than São Paulo or Rio. A practical choice for families wanting a Brazilian base."
  },
  {
    id: "26",
    slug: "santa-teresa",
    name: "Santa Teresa",
    country: "Costa Rica",
    countryCode: "CR",
    continent: "Latin America",
    photo: "https://images.unsplash.com/photo-1500259571355-332da5cb07aa?w=800&h=500&fit=crop",
    coords: { lat: 9.6402, lng: -85.1631 },
    scores: { family: 76, childSafety: 70, schoolAccess: 58, nature: 92, internet: 65, healthcare: 60 },
    cost: { familyMonthly: 2800, rent2br: 1200, internationalSchool: 500, localSchool: 80, childcare: 250 },
    meta: {
      familiesNow: 15, familiesBeen: 180, returnRate: 58,
      bestMonths: ["December", "January", "February", "March", "April"],
      timezone: "America/Costa_Rica", language: ["Spanish", "English"],
      homeschoolLegal: "Yes", visaFriendly: "Good", kidsAgeIdeal: "Young children"
    },
    tags: ["surf", "beach", "nature", "warm", "tropical", "expat community"],
    description: "Santa Teresa is a surf town on Costa Rica's Pacific coast with a tight-knit expat family scene. The nature is extraordinary, the kids surf before school, and the pura vida pace is real."
  },
  {
    id: "27",
    slug: "kotor",
    name: "Kotor",
    country: "Montenegro",
    countryCode: "ME",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1555990538-1a0f5a2b3f58?w=800&h=500&fit=crop",
    coords: { lat: 42.4247, lng: 18.7712 },
    scores: { family: 74, childSafety: 82, schoolAccess: 50, nature: 90, internet: 70, healthcare: 58 },
    cost: { familyMonthly: 2000, rent2br: 800, internationalSchool: 400, localSchool: 0, childcare: 200 },
    meta: {
      familiesNow: 9, familiesBeen: 110, returnRate: 48,
      bestMonths: ["May", "June", "September", "October"],
      timezone: "Europe/Podgorica", language: ["Montenegrin", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["beach", "mountains", "safe", "nature", "mediterranean"],
    description: "Kotor is a UNESCO fjord town with dramatic mountains meeting the Adriatic. Small, walkable, and safe — families fall in love with the old town and the bay's swimming spots."
  },
  {
    id: "28",
    slug: "lefkada",
    name: "Lefkada",
    country: "Greece",
    countryCode: "GR",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&h=500&fit=crop",
    coords: { lat: 38.8337, lng: 20.7069 },
    scores: { family: 76, childSafety: 85, schoolAccess: 45, nature: 92, internet: 62, healthcare: 60 },
    cost: { familyMonthly: 2200, rent2br: 900, internationalSchool: 0, localSchool: 0, childcare: 200 },
    meta: {
      familiesNow: 6, familiesBeen: 75, returnRate: 52,
      bestMonths: ["May", "June", "July", "August", "September"],
      timezone: "Europe/Athens", language: ["Greek", "English"],
      homeschoolLegal: "Restricted", visaFriendly: "OK", kidsAgeIdeal: "Young children"
    },
    tags: ["beach", "nature", "safe", "warm", "mediterranean"],
    description: "Lefkada is a Greek island connected by bridge to the mainland — no ferry needed. Turquoise beaches, olive groves, and a slow island life that families with young children find perfect."
  },
  {
    id: "29",
    slug: "ericeira",
    name: "Ericeira",
    country: "Portugal",
    countryCode: "PT",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1504681869696-d977211a5f4c?w=800&h=500&fit=crop",
    coords: { lat: 38.9626, lng: -9.4154 },
    scores: { family: 82, childSafety: 86, schoolAccess: 68, nature: 85, internet: 76, healthcare: 74 },
    cost: { familyMonthly: 2600, rent2br: 1200, internationalSchool: 500, localSchool: 0, childcare: 300 },
    meta: {
      familiesNow: 16, familiesBeen: 210, returnRate: 68,
      bestMonths: ["May", "June", "July", "August", "September"],
      timezone: "Europe/Lisbon", language: ["Portuguese", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "Excellent", kidsAgeIdeal: "All ages"
    },
    tags: ["surf", "beach", "safe", "nature", "expat community", "mediterranean"],
    description: "Ericeira is Europe's only World Surfing Reserve and has become a magnet for surf families. 30 minutes from Lisbon, it offers village life with city access and a booming family expat scene."
  },
  {
    id: "30",
    slug: "montanita",
    name: "Montañita",
    country: "Ecuador",
    countryCode: "EC",
    continent: "Latin America",
    photo: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&h=500&fit=crop",
    coords: { lat: -1.8285, lng: -80.7543 },
    scores: { family: 65, childSafety: 55, schoolAccess: 40, nature: 82, internet: 55, healthcare: 48 },
    cost: { familyMonthly: 1400, rent2br: 450, internationalSchool: 250, localSchool: 30, childcare: 100 },
    meta: {
      familiesNow: 5, familiesBeen: 60, returnRate: 35,
      bestMonths: ["December", "January", "February", "March", "April"],
      timezone: "America/Guayaquil", language: ["Spanish", "English"],
      homeschoolLegal: "Yes", visaFriendly: "Good", kidsAgeIdeal: "Teens"
    },
    tags: ["surf", "beach", "low cost", "nature", "warm", "tropical"],
    description: "Montañita is Ecuador's surf capital — raw, affordable, and adventurous. Best suited for older kids and teens. The cost of living is among the lowest on this list."
  },
  {
    id: "31",
    slug: "da-nang",
    name: "Da Nang",
    country: "Vietnam",
    countryCode: "VN",
    continent: "Asia",
    photo: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&h=500&fit=crop",
    coords: { lat: 16.0544, lng: 108.2022 },
    scores: { family: 80, childSafety: 75, schoolAccess: 68, nature: 82, internet: 80, healthcare: 65 },
    cost: { familyMonthly: 1600, rent2br: 500, internationalSchool: 350, localSchool: 40, childcare: 150 },
    meta: {
      familiesNow: 20, familiesBeen: 250, returnRate: 58,
      bestMonths: ["February", "March", "April", "May"],
      timezone: "Asia/Ho_Chi_Minh", language: ["Vietnamese", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["beach", "low cost", "nature", "warm", "tropical", "expat community"],
    description: "Da Nang sits on Vietnam's central coast with a long sandy beach, the Marble Mountains behind it, and some of the cheapest family living in Asia. The international school scene is small but growing fast."
  },
  {
    id: "32",
    slug: "split",
    name: "Split",
    country: "Croatia",
    countryCode: "HR",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1555990793-da11153b2473?w=800&h=500&fit=crop",
    coords: { lat: 43.5081, lng: 16.4402 },
    scores: { family: 79, childSafety: 85, schoolAccess: 60, nature: 85, internet: 75, healthcare: 72 },
    cost: { familyMonthly: 2800, rent2br: 1100, internationalSchool: 500, localSchool: 0, childcare: 300 },
    meta: {
      familiesNow: 12, familiesBeen: 150, returnRate: 55,
      bestMonths: ["May", "June", "September", "October"],
      timezone: "Europe/Zagreb", language: ["Croatian", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "OK", kidsAgeIdeal: "All ages"
    },
    tags: ["beach", "safe", "nature", "mountains", "mediterranean"],
    description: "Split is a 1,700-year-old Roman palace turned living city on the Adriatic. Crystal-clear water, island-hopping by ferry, and a walkable old town that kids love exploring."
  },
  {
    id: "33",
    slug: "tulum",
    name: "Tulum",
    country: "Mexico",
    countryCode: "MX",
    continent: "Latin America",
    photo: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&h=500&fit=crop",
    coords: { lat: 20.2114, lng: -87.4654 },
    scores: { family: 75, childSafety: 60, schoolAccess: 58, nature: 88, internet: 68, healthcare: 62 },
    cost: { familyMonthly: 3200, rent2br: 1400, internationalSchool: 500, localSchool: 80, childcare: 250 },
    meta: {
      familiesNow: 18, familiesBeen: 220, returnRate: 52,
      bestMonths: ["November", "December", "January", "February", "March"],
      timezone: "America/Cancun", language: ["Spanish", "English"],
      homeschoolLegal: "Yes", visaFriendly: "Good", kidsAgeIdeal: "Young children"
    },
    tags: ["beach", "nature", "warm", "tropical", "expat community"],
    description: "Tulum blends Mayan ruins, cenotes, and Caribbean coastline into one of Mexico's most photogenic family destinations. More expensive than other Mexican towns but the nature is unmatched."
  },
  {
    id: "34",
    slug: "taipei",
    name: "Taipei",
    country: "Taiwan",
    countryCode: "TW",
    continent: "Asia",
    photo: "https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800&h=500&fit=crop",
    coords: { lat: 25.033, lng: 121.5654 },
    scores: { family: 86, childSafety: 92, schoolAccess: 82, nature: 70, internet: 90, healthcare: 88 },
    cost: { familyMonthly: 2800, rent2br: 1100, internationalSchool: 650, localSchool: 0, childcare: 350 },
    meta: {
      familiesNow: 14, familiesBeen: 180, returnRate: 62,
      bestMonths: ["March", "April", "October", "November"],
      timezone: "Asia/Taipei", language: ["Mandarin", "English"],
      homeschoolLegal: "Yes", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["safe", "international schools", "nature", "mountains", "variable"],
    description: "Taipei is one of Asia's safest cities with world-class healthcare, blazing internet, and hiking trails accessible by metro. Night markets are a family dinner staple."
  },
  {
    id: "35",
    slug: "tallinn",
    name: "Tallinn",
    country: "Estonia",
    countryCode: "EE",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&h=500&fit=crop",
    coords: { lat: 59.437, lng: 24.7536 },
    scores: { family: 80, childSafety: 88, schoolAccess: 75, nature: 72, internet: 92, healthcare: 78 },
    cost: { familyMonthly: 2600, rent2br: 1000, internationalSchool: 550, localSchool: 0, childcare: 300 },
    meta: {
      familiesNow: 10, familiesBeen: 130, returnRate: 48,
      bestMonths: ["May", "June", "July", "August"],
      timezone: "Europe/Tallinn", language: ["Estonian", "English", "Russian"],
      homeschoolLegal: "Yes", visaFriendly: "Good", kidsAgeIdeal: "Teens"
    },
    tags: ["safe", "international schools", "expat community", "variable"],
    description: "Tallinn is the world's most digitally advanced city — e-residency, digital nomad visa, and the fastest public internet in Europe. The medieval old town is a fairy tale for kids."
  },
  {
    id: "36",
    slug: "buenos-aires",
    name: "Buenos Aires",
    country: "Argentina",
    countryCode: "AR",
    continent: "Latin America",
    photo: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&h=500&fit=crop",
    coords: { lat: -34.6037, lng: -58.3816 },
    scores: { family: 76, childSafety: 62, schoolAccess: 78, nature: 55, internet: 78, healthcare: 75 },
    cost: { familyMonthly: 1900, rent2br: 700, internationalSchool: 450, localSchool: 50, childcare: 200 },
    meta: {
      familiesNow: 16, familiesBeen: 200, returnRate: 50,
      bestMonths: ["March", "April", "October", "November"],
      timezone: "America/Argentina/Buenos_Aires", language: ["Spanish", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "Good", kidsAgeIdeal: "Teens"
    },
    tags: ["expat community", "international schools", "low cost", "variable"],
    description: "Buenos Aires is South America's most cosmopolitan city. Incredible food, strong bilingual schools, tango in the parks, and a cost of living that keeps dropping for families earning in dollars or euros."
  },
  {
    id: "37",
    slug: "kuala-lumpur",
    name: "Kuala Lumpur",
    country: "Malaysia",
    countryCode: "MY",
    continent: "Asia",
    photo: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&h=500&fit=crop",
    coords: { lat: 3.139, lng: 101.6869 },
    scores: { family: 83, childSafety: 76, schoolAccess: 85, nature: 65, internet: 82, healthcare: 80 },
    cost: { familyMonthly: 2200, rent2br: 700, internationalSchool: 500, localSchool: 50, childcare: 200 },
    meta: {
      familiesNow: 22, familiesBeen: 280, returnRate: 60,
      bestMonths: ["March", "April", "May", "June"],
      timezone: "Asia/Kuala_Lumpur", language: ["Malay", "English", "Mandarin"],
      homeschoolLegal: "Yes", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["international schools", "low cost", "expat community", "tropical", "warm"],
    description: "KL has the best international school ecosystem in Southeast Asia at a fraction of Singapore's price. English is widely spoken, healthcare is excellent, and the food is legendary."
  },
  {
    id: "38",
    slug: "dubai",
    name: "Dubai",
    country: "UAE",
    countryCode: "AE",
    continent: "Asia",
    photo: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=500&fit=crop",
    coords: { lat: 25.2048, lng: 55.2708 },
    scores: { family: 82, childSafety: 90, schoolAccess: 90, nature: 40, internet: 88, healthcare: 85 },
    cost: { familyMonthly: 4500, rent2br: 2000, internationalSchool: 1000, localSchool: 200, childcare: 500 },
    meta: {
      familiesNow: 25, familiesBeen: 320, returnRate: 65,
      bestMonths: ["October", "November", "December", "January", "February", "March"],
      timezone: "Asia/Dubai", language: ["Arabic", "English"],
      homeschoolLegal: "Restricted", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["safe", "international schools", "warm", "expat community"],
    description: "Dubai is the premium option — world-class schools, zero crime, tax-free income, and a family infrastructure built for expats. Expensive but families with remote income find the quality of life hard to match."
  },
  {
    id: "39",
    slug: "auckland",
    name: "Auckland",
    country: "New Zealand",
    countryCode: "NZ",
    continent: "Asia",
    photo: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&h=500&fit=crop",
    coords: { lat: -36.8485, lng: 174.7633 },
    scores: { family: 88, childSafety: 90, schoolAccess: 85, nature: 92, internet: 82, healthcare: 85 },
    cost: { familyMonthly: 4200, rent2br: 1800, internationalSchool: 800, localSchool: 0, childcare: 500 },
    meta: {
      familiesNow: 10, familiesBeen: 140, returnRate: 58,
      bestMonths: ["December", "January", "February", "March"],
      timezone: "Pacific/Auckland", language: ["English", "Maori"],
      homeschoolLegal: "Yes", visaFriendly: "OK", kidsAgeIdeal: "All ages"
    },
    tags: ["nature", "safe", "beach", "mountains", "variable"],
    description: "Auckland offers beaches, rainforest, and volcanoes within 30 minutes of the CBD. New Zealand's homeschool-friendly laws and outdoor culture make it a dream for nature-first families."
  },
  {
    id: "40",
    slug: "marrakech",
    name: "Marrakech",
    country: "Morocco",
    countryCode: "MA",
    continent: "Africa",
    photo: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800&h=500&fit=crop",
    coords: { lat: 31.6295, lng: -7.9811 },
    scores: { family: 70, childSafety: 62, schoolAccess: 55, nature: 70, internet: 65, healthcare: 55 },
    cost: { familyMonthly: 1800, rent2br: 600, internationalSchool: 400, localSchool: 80, childcare: 150 },
    meta: {
      familiesNow: 8, familiesBeen: 110, returnRate: 42,
      bestMonths: ["October", "November", "March", "April"],
      timezone: "Africa/Casablanca", language: ["Arabic", "French", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["low cost", "nature", "warm", "mountains"],
    description: "Marrakech is sensory overload in the best way — the medina, the Atlas Mountains, the riads. Affordable, warm, and a growing base for adventurous families who want Africa without the logistical hardship."
  },
  {
    id: "41",
    slug: "prague",
    name: "Prague",
    country: "Czech Republic",
    countryCode: "CZ",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&h=500&fit=crop",
    coords: { lat: 50.0755, lng: 14.4378 },
    scores: { family: 82, childSafety: 88, schoolAccess: 80, nature: 65, internet: 85, healthcare: 80 },
    cost: { familyMonthly: 2800, rent2br: 1200, internationalSchool: 550, localSchool: 0, childcare: 300 },
    meta: {
      familiesNow: 14, familiesBeen: 190, returnRate: 55,
      bestMonths: ["April", "May", "June", "September", "October"],
      timezone: "Europe/Prague", language: ["Czech", "English"],
      homeschoolLegal: "Yes", visaFriendly: "OK", kidsAgeIdeal: "All ages"
    },
    tags: ["safe", "international schools", "expat community", "variable"],
    description: "Prague is a fairy-tale city that's surprisingly practical for families. Strong international schools, safe streets, excellent public transport, and a central European location for easy weekend trips."
  },
  {
    id: "42",
    slug: "medellin-envigado",
    name: "Envigado",
    country: "Colombia",
    countryCode: "CO",
    continent: "Latin America",
    photo: "https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?w=800&h=500&fit=crop",
    coords: { lat: 6.1714, lng: -75.5879 },
    scores: { family: 78, childSafety: 72, schoolAccess: 70, nature: 78, internet: 75, healthcare: 72 },
    cost: { familyMonthly: 1900, rent2br: 650, internationalSchool: 400, localSchool: 80, childcare: 200 },
    meta: {
      familiesNow: 12, familiesBeen: 160, returnRate: 55,
      bestMonths: ["December", "January", "February", "March"],
      timezone: "America/Bogota", language: ["Spanish", "English"],
      homeschoolLegal: "Yes", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["mountains", "low cost", "safe", "nature", "warm", "expat community"],
    description: "Envigado is the quieter, safer suburb south of Medellín where most families actually live. Same eternal spring weather, lower crime, better walkability, and a tight-knit expat parent community."
  },
  {
    id: "43",
    slug: "crete",
    name: "Crete",
    country: "Greece",
    countryCode: "GR",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=500&fit=crop",
    coords: { lat: 35.2401, lng: 24.4709 },
    scores: { family: 78, childSafety: 84, schoolAccess: 50, nature: 92, internet: 65, healthcare: 65 },
    cost: { familyMonthly: 2400, rent2br: 900, internationalSchool: 0, localSchool: 0, childcare: 200 },
    meta: {
      familiesNow: 8, familiesBeen: 100, returnRate: 52,
      bestMonths: ["May", "June", "September", "October"],
      timezone: "Europe/Athens", language: ["Greek", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "OK", kidsAgeIdeal: "Young children"
    },
    tags: ["beach", "nature", "mountains", "safe", "warm", "mediterranean"],
    description: "Crete is Greece's largest island with mountains, gorges, and beaches that rival the Caribbean. No international schools — this is a homeschool family destination where kids live outdoors."
  },
  {
    id: "44",
    slug: "ho-chi-minh",
    name: "Ho Chi Minh City",
    country: "Vietnam",
    countryCode: "VN",
    continent: "Asia",
    photo: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&h=500&fit=crop",
    coords: { lat: 10.8231, lng: 106.6297 },
    scores: { family: 77, childSafety: 68, schoolAccess: 78, nature: 50, internet: 82, healthcare: 68 },
    cost: { familyMonthly: 2000, rent2br: 650, internationalSchool: 500, localSchool: 50, childcare: 180 },
    meta: {
      familiesNow: 18, familiesBeen: 230, returnRate: 55,
      bestMonths: ["December", "January", "February", "March"],
      timezone: "Asia/Ho_Chi_Minh", language: ["Vietnamese", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "Good", kidsAgeIdeal: "All ages"
    },
    tags: ["low cost", "international schools", "expat community", "warm", "tropical"],
    description: "Saigon is Vietnam's economic engine with a massive international school ecosystem and one of the world's best street food scenes. Chaotic but thrilling — families either love it or move to Da Nang."
  },
  {
    id: "45",
    slug: "funchal",
    name: "Funchal",
    country: "Portugal",
    countryCode: "PT",
    continent: "Europe",
    photo: "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800&h=500&fit=crop",
    coords: { lat: 32.6669, lng: -16.9241 },
    scores: { family: 79, childSafety: 86, schoolAccess: 55, nature: 90, internet: 75, healthcare: 72 },
    cost: { familyMonthly: 2400, rent2br: 1000, internationalSchool: 400, localSchool: 0, childcare: 250 },
    meta: {
      familiesNow: 10, familiesBeen: 120, returnRate: 58,
      bestMonths: ["April", "May", "June", "September", "October"],
      timezone: "Atlantic/Madeira", language: ["Portuguese", "English"],
      homeschoolLegal: "Yes (grey area)", visaFriendly: "Excellent", kidsAgeIdeal: "All ages"
    },
    tags: ["nature", "mountains", "safe", "warm", "beach", "mediterranean"],
    description: "Funchal is Madeira's capital — a subtropical island with levada walks, year-round mild weather, and Portuguese visa advantages. Quieter than the mainland, with a growing remote family community."
  }
]

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
  }
]

import { extractionCompletion } from "./llm"
import { FISDimensionKey } from "./types"
import { ClassifiedArticle } from "./intelligence-types"
import { GdeltArticle } from "./api-integrations"

export type { GdeltArticle } from "./api-integrations"

const DIMENSION_DESCRIPTIONS: Record<FISDimensionKey, string> = {
  childSafety: "Crime, safety, air quality, traffic, natural disasters, political stability",
  educationAccess: "Schools, curriculum, enrollment, education policy, homeschool laws, learning",
  familyCost: "Rent, cost of living, groceries, school fees, childcare costs, inflation",
  healthcare: "Hospitals, doctors, pediatricians, insurance, emergency care, health policy",
  nature: "Parks, playgrounds, outdoor activities, environment, pollution, climate, beaches",
  community: "Expat community, family groups, social activities, meetups, integration",
  remoteWork: "Coworking, internet, digital nomad visas, remote work policy, business",
  visa: "Visa policy, immigration, residency permits, passport requirements, legal changes",
  lifestyle: "Culture, food, entertainment, sports, martial arts, surf, activities for kids",
}

/**
 * Classify a batch of articles for a city.
 * Returns only family-relevant articles with dimension + sentiment.
 * Processes in batches of 5 to stay within Groq token limits.
 */
export async function classifyArticles(
  articles: GdeltArticle[],
  cityName: string,
  countryName: string,
): Promise<ClassifiedArticle[]> {
  if (articles.length === 0) return []

  const results: ClassifiedArticle[] = []
  const batchSize = 5

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize)

    const articleList = batch.map((a, idx) =>
      `[${idx + 1}] "${a.title}" (${a.source}, ${a.publishDate})`
    ).join("\n")

    const dimensionList = Object.entries(DIMENSION_DESCRIPTIONS)
      .map(([key, desc]) => `- ${key}: ${desc}`)
      .join("\n")

    try {
      const response = await extractionCompletion([
        {
          role: "system",
          content: `You classify news articles for relevance to families considering living in ${cityName}, ${countryName}.

For each article, determine:
1. Is it relevant to a family with children considering relocating to or living in this city? (relevance 0-10, where 0 = completely irrelevant, 10 = critical for family decisions)
2. Which FIS dimension does it most affect?
3. Is the sentiment positive, negative, or neutral for families?
4. Write a one-sentence summary explaining why a parent would care.

FIS dimensions:
${dimensionList}

Respond with ONLY a JSON array. No markdown, no backticks, no explanation.
Each element: {"index": 1, "relevant": true/false, "relevance": 0-10, "dimension": "dimensionKey" or null, "sentiment": "positive"/"negative"/"neutral", "summary": "one sentence for parents"}

Articles with relevance < 3 should have relevant: false.
Articles about sports scores, celebrity gossip, national politics with no local impact, business deals unrelated to daily life — mark as not relevant.
Articles about safety incidents, school changes, visa policy, cost changes, new facilities, health alerts, environmental changes, community events — mark as relevant.`,
        },
        {
          role: "user",
          content: `Classify these articles about ${cityName}:\n\n${articleList}`,
        },
      ])

      // Parse JSON response
      const cleaned = response.replace(/```json\s*|```/g, "").trim()
      const classifications = JSON.parse(cleaned)

      for (const cls of classifications) {
        if (!cls.relevant || cls.relevance < 3) continue
        const article = batch[cls.index - 1]
        if (!article) continue

        results.push({
          title: article.title,
          url: article.url,
          sourceDomain: article.source,
          publishDate: article.publishDate,
          dimension: cls.dimension || null,
          sentiment: cls.sentiment || "neutral",
          relevanceScore: cls.relevance || 0,
          familySummary: cls.summary || "",
        })
      }
    } catch (err) {
      console.error(`[classifier] Batch ${i}-${i + batchSize} failed:`, err)
      // Skip failed batch, continue with next
    }

    // Rate limit: 1s between batches
    if (i + batchSize < articles.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
}

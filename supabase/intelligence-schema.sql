-- City intelligence: weekly engine output per city
CREATE TABLE IF NOT EXISTS city_intelligence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city_slug TEXT NOT NULL,

  -- Dimension modifiers from news + data changes (feed into FIS)
  dimension_modifiers JSONB NOT NULL DEFAULT '{}',
  -- Example: {"childSafety": -2, "educationAccess": 3, "familyCost": 0, ...}

  -- City narrative: 2-3 sentence "what changed" for the overview tab
  city_narrative TEXT,

  -- Trend signal
  trend TEXT NOT NULL DEFAULT 'stable',
  -- "heating" | "cooling" | "stable"
  trend_reason TEXT,

  -- Arrival curve
  arrival_curve TEXT NOT NULL DEFAULT 'established',
  -- "emerging" | "established" | "trending" | "saturated"

  -- Top signals: the most important changes this period
  top_signals JSONB NOT NULL DEFAULT '[]',
  -- [{type: "news", headline: "...", dimension: "childSafety", sentiment: "negative"},
  --  {type: "api", source: "Open-Meteo", change: "AQI improved 15%"},
  --  {type: "family_report", note: "New report rated schools 5/5"}]

  -- Classified articles: GDELT articles that passed classification
  classified_articles JSONB NOT NULL DEFAULT '[]',
  -- [{title, url, source, dimension, sentiment, relevanceScore, familySummary}]

  -- Data gaps: fields that need family reports to improve
  data_gaps JSONB NOT NULL DEFAULT '[]',
  -- [{field: "healthcare.emergencyNarrative", label: "Emergency care experience", priority: "high"}]

  -- Metadata
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(city_slug, period_start)
);

-- Index for fast city lookups
CREATE INDEX IF NOT EXISTS idx_city_intelligence_slug ON city_intelligence(city_slug, generated_at DESC);

-- Classified articles: individual article classifications (for audit trail)
CREATE TABLE IF NOT EXISTS classified_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city_slug TEXT NOT NULL,

  -- Article data from GDELT
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source_domain TEXT,
  publish_date TIMESTAMP WITH TIME ZONE,

  -- LLM classification
  dimension TEXT,                    -- FIS dimension key or null if not relevant
  sentiment TEXT DEFAULT 'neutral',  -- "positive" | "negative" | "neutral"
  relevance_score INTEGER DEFAULT 0, -- 0-10, how relevant to families
  family_summary TEXT,               -- one-line summary written for parents

  -- Metadata
  classified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  classified_by TEXT DEFAULT 'groq-llama-3.3-70b',

  -- Don't re-classify the same article
  UNIQUE(city_slug, url)
);

CREATE INDEX IF NOT EXISTS idx_classified_articles_slug ON classified_articles(city_slug, classified_at DESC);
CREATE INDEX IF NOT EXISTS idx_classified_articles_dimension ON classified_articles(dimension, sentiment);

-- Family briefings: personalized intelligence per family
CREATE TABLE IF NOT EXISTS family_briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Briefing content
  briefing_items JSONB NOT NULL DEFAULT '[]',
  -- [{citySlug, cityName, items: [{type, headline, detail, dimension, relevance}]}]

  -- Summary
  headline TEXT,           -- "3 updates across your watched cities"
  total_items INTEGER DEFAULT 0,

  -- Metadata
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(family_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_family_briefings_family ON family_briefings(family_id, generated_at DESC);

-- Saved cities: move from localStorage to database for server-side briefings
CREATE TABLE IF NOT EXISTS saved_cities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  city_slug TEXT NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notify BOOLEAN DEFAULT true,  -- include in weekly briefing

  UNIQUE(family_id, city_slug)
);

CREATE INDEX IF NOT EXISTS idx_saved_cities_family ON saved_cities(family_id);

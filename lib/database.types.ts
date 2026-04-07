export type Database = {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          user_id: string
          family_name: string
          home_country: string
          country_code: string
          kids_ages: number[]
          travel_style: string
          bio: string
          avatar_url: string | null
          parent_work_type: string
          education_approach: string
          languages: string[]
          interests: string[]
          current_city: string
          membership_tier: "free" | "paid"
          membership_paid_at: string | null
          username: string | null
          onboarding_complete: boolean
          primary_anxiety: string | null
          secondary_anxiety: string | null
          real_budget_min: number | null
          real_budget_max: number | null
          passport_tier: string | null
          next_destination_candidates: string[]
          departure_horizon: string | null
          decision_stage: string | null
          top_priorities: string[]
          deal_breakers: string[]
          ai_profile_summary: string | null
          ai_conversation_turns: number
          ai_last_extracted: string | null
          chat_history: unknown
          companion_last_checkin: string | null
          companion_next_question: string | null
          open_to_introductions: boolean
          total_points: number | null
          level: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          family_name: string
          home_country?: string
          country_code?: string
          kids_ages?: number[]
          travel_style?: string
          bio?: string
          avatar_url?: string | null
          parent_work_type?: string
          education_approach?: string
          languages?: string[]
          interests?: string[]
          current_city?: string
          membership_tier?: "free" | "paid"
          membership_paid_at?: string | null
          username?: string | null
          onboarding_complete?: boolean
          primary_anxiety?: string | null
          secondary_anxiety?: string | null
          real_budget_min?: number | null
          real_budget_max?: number | null
          passport_tier?: string | null
          next_destination_candidates?: string[]
          departure_horizon?: string | null
          decision_stage?: string | null
          top_priorities?: string[]
          deal_breakers?: string[]
          ai_profile_summary?: string | null
          ai_conversation_turns?: number
          ai_last_extracted?: string | null
          chat_history?: unknown
          companion_last_checkin?: string | null
          companion_next_question?: string | null
          open_to_introductions?: boolean
          total_points?: number | null
          level?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          family_name?: string
          home_country?: string
          country_code?: string
          kids_ages?: number[]
          travel_style?: string
          bio?: string
          avatar_url?: string | null
          parent_work_type?: string
          education_approach?: string
          languages?: string[]
          interests?: string[]
          current_city?: string
          membership_tier?: "free" | "paid"
          membership_paid_at?: string | null
          username?: string | null
          onboarding_complete?: boolean
          primary_anxiety?: string | null
          secondary_anxiety?: string | null
          real_budget_min?: number | null
          real_budget_max?: number | null
          passport_tier?: string | null
          next_destination_candidates?: string[]
          departure_horizon?: string | null
          decision_stage?: string | null
          top_priorities?: string[]
          deal_breakers?: string[]
          ai_profile_summary?: string | null
          ai_conversation_turns?: number
          ai_last_extracted?: string | null
          chat_history?: unknown
          companion_last_checkin?: string | null
          companion_next_question?: string | null
          open_to_introductions?: boolean
          total_points?: number | null
          level?: number | null
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          family_id: string
          city_slug: string
          status: "here_now" | "been_here"
          arrived_at: string | null
          left_at: string | null
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          city_slug: string
          status: "here_now" | "been_here"
          arrived_at?: string | null
          left_at?: string | null
          notes?: string
          created_at?: string
        }
        Update: {
          status?: "here_now" | "been_here"
          arrived_at?: string | null
          left_at?: string | null
          notes?: string
        }
      }
      reviews: {
        Row: {
          id: string
          family_id: string
          city_slug: string
          rating: number
          text: string
          best_neighbourhood: string
          school_used: string
          housing_cost_reality: string
          would_do_differently: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          city_slug: string
          rating: number
          text: string
          best_neighbourhood?: string
          school_used?: string
          housing_cost_reality?: string
          would_do_differently?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          rating?: number
          text?: string
          best_neighbourhood?: string
          school_used?: string
          housing_cost_reality?: string
          would_do_differently?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Family = Database["public"]["Tables"]["families"]["Row"]
export type Trip = Database["public"]["Tables"]["trips"]["Row"]
export type Review = Database["public"]["Tables"]["reviews"]["Row"]

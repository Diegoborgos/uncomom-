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
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          city_slug: string
          status: "here_now" | "been_here"
          arrived_at?: string | null
          left_at?: string | null
          created_at?: string
        }
        Update: {
          status?: "here_now" | "been_here"
          arrived_at?: string | null
          left_at?: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          family_id: string
          city_slug: string
          rating: number
          text: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          city_slug: string
          rating: number
          text: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          rating?: number
          text?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Family = Database["public"]["Tables"]["families"]["Row"]
export type Trip = Database["public"]["Tables"]["trips"]["Row"]
export type Review = Database["public"]["Tables"]["reviews"]["Row"]

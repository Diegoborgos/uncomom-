/**
 * STORAGE RULE — READ THIS BEFORE ADDING ANY IMAGE TO THE CODEBASE:
 *
 * All images in Uncomun are stored in Supabase Storage bucket 'city-photos'.
 * Never hotlink from external URLs (Unsplash, Google, etc.) in production code.
 * Never use supabase.storage directly — always go through lib/storage.ts.
 *
 * To add a new city photo:
 *   1. Go to /admin/cities in the app
 *   2. Select the city
 *   3. Upload the photo using the file input
 *   4. The URL is automatically saved to the cities table
 */

import { createClient } from "@supabase/supabase-js"

const CITY_PHOTOS_BUCKET = "city-photos"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""

export function getCityPhotoUrl(citySlug: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${CITY_PHOTOS_BUCKET}/${citySlug}.jpg`
}

export async function uploadCityPhoto(
  citySlug: string,
  file: File | Blob | ArrayBuffer,
  contentType: string = "image/jpeg"
): Promise<{ url: string | null; error: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { url: null, error: "Storage not configured" }

  const adminClient = createClient(url, key, { auth: { persistSession: false } })
  const filename = `${citySlug}.jpg`

  const { error: uploadError } = await adminClient.storage
    .from(CITY_PHOTOS_BUCKET)
    .upload(filename, file, { contentType, upsert: true, cacheControl: "31536000" })

  if (uploadError) return { url: null, error: uploadError.message }

  const { data: { publicUrl } } = adminClient.storage
    .from(CITY_PHOTOS_BUCKET)
    .getPublicUrl(filename)

  return { url: publicUrl, error: null }
}

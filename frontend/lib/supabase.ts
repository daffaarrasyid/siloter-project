import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zbgbsffibkuvpazxjlsa.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

/**
 * Client Supabase untuk browser/frontend Next.js.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Helper untuk normalisasi login:
 * Mendukung input username sederhana ('admin', 'operator')
 * maupun email penuh ('admin@siloter.bogor.go.id').
 */
export function normalizeLoginIdentifier(identifier: string): string {
  const trimmed = identifier.trim().toLowerCase();
  if (trimmed.includes("@")) {
    return trimmed;
  }
  if (trimmed === "admin") {
    return "admin@siloter.bogor.go.id";
  }
  if (trimmed === "operator") {
    return "operator@siloter.bogor.go.id";
  }
  // Default format domain internal Dishub
  return `${trimmed}@siloter.bogor.go.id`;
}


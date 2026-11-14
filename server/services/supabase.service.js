import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables"
  );
}

export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey
);

export async function ensureStorageBuckets() {
  const buckets = [
    { name: "study-documents", public: false },
    { name: "lecture-recordings", public: false },
  ];

  for (const b of buckets) {
    try {
      const { error } = await supabase.storage.createBucket(b.name, { public: b.public });
      if (error && !error.message?.includes("already exists")) {
        console.warn(`[Storage] Bucket create note for ${b.name}:`, error.message);
      }
    } catch (e) {
      console.warn(`[Storage] Bucket create exception for ${b.name}:`, e.message);
    }
  }
}

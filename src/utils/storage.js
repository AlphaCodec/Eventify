/**
 * Legacy localStorage utility — kept for reference only.
 * This app now uses Supabase for all persistence.
 * This file is intentionally left as a no-op stub so any
 * old imports don't break during migration.
 */
export const storage = {
  get:    () => null,
  set:    () => false,
  remove: () => {},
  clear:  () => {},
};

export function initStorage() {
  // No-op: data is seeded via Supabase migration SQL
}

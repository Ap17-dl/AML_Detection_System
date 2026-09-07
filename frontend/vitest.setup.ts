// Test-only defaults so importing modules that read `src/lib/env.ts` never requires a real
// Supabase project — tests that care about these values mock the modules that use them instead.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.NEXT_PUBLIC_API_BASE_URL ??= "http://localhost:8000";

import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

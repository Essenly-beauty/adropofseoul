// React.cache() was added in React 19 and is absent in React 18.
// In test environments (Vitest + jsdom with React 18) cache is undefined.
// This shim returns the function as-is when cache is unavailable so that
// module-level wrapping never throws, and the behaviour is a transparent
// passthrough (exactly what the spec describes as the test-safe expectation).
import { cache as reactCache } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cache: typeof reactCache =
  typeof reactCache === "function" ? reactCache : (fn: any) => fn;

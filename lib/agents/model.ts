import { gateway } from "ai";

// Model IDs are Vercel AI Gateway strings ("provider/model"). Verified against
// https://ai-gateway.vercel.sh/v1/models — re-check when changing.
export const DEFAULT_RESEARCH_MODEL = "anthropic/claude-sonnet-5";

/**
 * The only place agent code obtains a model. Orchestration modules
 * (services/agents/*) take a model as a parameter so tests inject a fake and
 * never touch the network; this factory is called at the entry point only.
 */
export function getModel(id: string = DEFAULT_RESEARCH_MODEL) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      "AI_GATEWAY_API_KEY is not set — agent features are unavailable. " +
        "See docs/PROVISIONING.md."
    );
  }
  return gateway(id);
}

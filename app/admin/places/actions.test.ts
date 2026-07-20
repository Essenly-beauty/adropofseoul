import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/services/admin/places", () => ({
  createPlace: vi.fn(async () => ({ id: "x" })),
  updatePlace: vi.fn(async () => {}),
  deletePlace: vi.fn(async () => {}),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { createPlace } from "@/services/admin/places";
import { createPlaceAction } from "./actions";

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

function mockUser(email: string | null) {
  (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    auth: {
      getUser: async () => ({
        data: { user: email ? { email } : null },
      }),
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_EMAILS = "admin@example.com";
});

describe("createPlaceAction auth", () => {
  it("redirects to login when not an allowed admin", async () => {
    mockUser("stranger@example.com");
    await expect(
      createPlaceAction(
        { ok: true },
        fd({ name: "X", category: "salon", entryType: "place" })
      )
    ).rejects.toThrow("REDIRECT:/admin/login");
    expect(createPlace).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input (no write)", async () => {
    mockUser("admin@example.com");
    const res = await createPlaceAction(
      { ok: true },
      fd({ name: "", category: "salon", entryType: "place" })
    );
    expect(res.ok).toBe(false);
    expect(res.errors?.name).toBeTruthy();
    expect(createPlace).not.toHaveBeenCalled();
  });

  it("creates then redirects for a valid admin submission", async () => {
    mockUser("admin@example.com");
    await expect(
      createPlaceAction(
        { ok: true },
        fd({ name: "New Spot", category: "salon", entryType: "place" })
      )
    ).rejects.toThrow("REDIRECT:/admin/places?created=1");
    expect(createPlace).toHaveBeenCalledOnce();
  });
});

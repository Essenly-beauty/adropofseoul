import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/services/admin/products", () => ({
  createProduct: vi.fn(async () => ({ id: "x" })),
  updateProduct: vi.fn(async () => {}),
  deleteProduct: vi.fn(async () => {}),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { createProduct } from "@/services/admin/products";
import { createProductAction } from "./actions";

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

describe("createProductAction auth", () => {
  it("redirects to login when not an allowed admin", async () => {
    mockUser("stranger@example.com");
    await expect(
      createProductAction({ ok: true }, fd({ name: "X" }))
    ).rejects.toThrow("REDIRECT:/admin/login");
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input (no write)", async () => {
    mockUser("admin@example.com");
    const res = await createProductAction({ ok: true }, fd({ name: "" }));
    expect(res.ok).toBe(false);
    expect(res.errors?.name).toBeTruthy();
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("creates then redirects for a valid admin submission", async () => {
    mockUser("admin@example.com");
    await expect(
      createProductAction({ ok: true }, fd({ name: "New Product" }))
    ).rejects.toThrow("REDIRECT:/admin/products?created=1");
    expect(createProduct).toHaveBeenCalledOnce();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/services/admin/posts", () => ({
  createPost: vi.fn(async () => ({ id: "x" })),
  updatePost: vi.fn(async () => {}),
  deletePost: vi.fn(async () => {}),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { createPost } from "@/services/admin/posts";
import { createPostAction } from "./actions";

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

describe("createPostAction auth", () => {
  it("redirects to login when not an allowed admin", async () => {
    mockUser("stranger@example.com");
    await expect(
      createPostAction(
        { ok: true },
        fd({ title: "X", category: "beauty", status: "draft" })
      )
    ).rejects.toThrow("REDIRECT:/admin/login");
    expect(createPost).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input (no write)", async () => {
    mockUser("admin@example.com");
    const res = await createPostAction(
      { ok: true },
      fd({ title: "", category: "beauty", status: "draft" })
    );
    expect(res.ok).toBe(false);
    expect(res.errors?.title).toBeTruthy();
    expect(createPost).not.toHaveBeenCalled();
  });

  it("creates then redirects for a valid admin submission", async () => {
    mockUser("admin@example.com");
    await expect(
      createPostAction(
        { ok: true },
        fd({ title: "New Post", category: "beauty", status: "draft" })
      )
    ).rejects.toThrow("REDIRECT:/admin/posts?created=1");
    expect(createPost).toHaveBeenCalledOnce();
  });
});

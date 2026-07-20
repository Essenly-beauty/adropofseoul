import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PostForm } from "./PostForm";
import type { AdminPost } from "@/services/admin/posts";

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    useFormState: (_action: unknown, initial: unknown) => [initial, vi.fn()],
  };
});

vi.mock("@/app/admin/posts/actions", () => ({
  createPostAction: vi.fn(),
  updatePostAction: vi.fn(),
  deletePostAction: vi.fn(),
}));

const post: AdminPost = {
  id: "1",
  title: "Test Post",
  slug: "test-post",
  subtitle: "A subtitle",
  excerpt: "An excerpt",
  body: "Body copy",
  category: "beauty",
  tags: ["glass-skin"],
  featuredImage: null,
  author: "A Drop of Seoul",
  seoTitle: null,
  metaDescription: null,
  publishedAt: null,
  status: "draft",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("PostForm", () => {
  it("renders core fields prefilled in edit mode with read-only slug", () => {
    render(<PostForm mode="edit" post={post} />);
    expect((screen.getByLabelText(/^Title$/i) as HTMLInputElement).value).toBe(
      "Test Post"
    );
    const slug = screen.getByLabelText(/Slug/i) as HTMLInputElement;
    expect(slug.value).toBe("test-post");
    expect(slug.readOnly).toBe(true);
    // delete button shows only in edit mode
    expect(screen.getByRole("button", { name: /delete/i })).toBeTruthy();
  });

  it("shows an editable slug and no delete button in create mode", () => {
    render(<PostForm mode="create" />);
    const slug = screen.getByLabelText(/Slug/i) as HTMLInputElement;
    expect(slug.readOnly).toBe(false);
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });
});

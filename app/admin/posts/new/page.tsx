import { PostForm } from "@/components/admin/PostForm";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">New post</h1>
      <div className="mt-6">
        <PostForm mode="create" />
      </div>
    </div>
  );
}

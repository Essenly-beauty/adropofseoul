import { PostForm } from "../PostForm";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">New post</h1>
      <div className="mt-6">
        <PostForm />
      </div>
    </div>
  );
}

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export function Prose({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-neutral max-w-none prose-headings:font-serif prose-a:text-accent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

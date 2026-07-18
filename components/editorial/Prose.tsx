import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { slugify } from "@/lib/slug";

// Flatten React children (strings + nested elements) into plain text.
function toText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return toText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

// Add stable, anchor-able ids to headings (added at the React layer, so
// rehype-sanitize never strips them). `scroll-mt` clears the sticky header.
const anchorComponents: Components = {
  h2: ({ children }) => (
    <h2 id={slugify(toText(children))} className="scroll-mt-24">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 id={slugify(toText(children))} className="scroll-mt-24">
      {children}
    </h3>
  ),
};

export function Prose({
  markdown,
  anchors = false,
}: {
  markdown: string;
  anchors?: boolean;
}) {
  return (
    <div className="prose prose-neutral max-w-none prose-headings:font-serif prose-a:text-accent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={anchors ? anchorComponents : undefined}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

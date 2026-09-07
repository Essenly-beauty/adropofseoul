import type { ReactNode } from "react";
import Image from "next/image";
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

// Authors may write a verdict as a heading followed by one bold statement.
// Normalize that editorial form into the same inline verdict token used by
// product reviews so every article receives one consistent visual treatment.
function normalizeEditorialMarkdown(markdown: string): string {
  return markdown.replace(
    /(^|\n)###\s+ADoS VERDICT\s*\n+\*\*([\s\S]*?)\*\*/gi,
    (_match, prefix: string, verdict: string) => {
      const statement = verdict
        .replace(/\\\s*\n/g, " ")
        .replace(/\s*\n\s*/g, " ")
        .trim();
      return `${prefix}**ADoS VERDICT — ${statement}**`;
    }
  );
}

// Add stable, anchor-able ids to headings (added at the React layer, so
// rehype-sanitize never strips them). `scroll-mt` clears the sticky header.
const anchorComponents: Components = {
  h2: ({ children }) => (
    <h2 id={slugify(toText(children))} className="scroll-mt-24">
      {children}
    </h2>
  ),
  h3: ({ children }) => renderEditorialH3(children, true),
};

function renderEditorialH3(children: ReactNode, anchored = false) {
  const label = toText(children).trim();
  if (/^ADoS VERDICT$/i.test(label)) {
    return (
      <h3
        id={anchored ? slugify(label) : undefined}
        className="not-prose mt-10 inline-flex scroll-mt-24 items-center rounded-full bg-porcelain px-3 py-2 text-[11px] font-semibold tracking-label text-accent"
      >
        ADoS verdict
      </h3>
    );
  }

  return (
    <h3 id={anchored ? slugify(label) : undefined} className="scroll-mt-24">
      {children}
    </h3>
  );
}

function renderEditorialParagraph(children: ReactNode) {
  const label = toText(children).trim();
  const verdict = label.match(/^ADoS VERDICT\s+—\s+(.+)$/i);
  if (verdict) {
    return (
      <p className="not-prose mt-5 inline-flex max-w-full flex-wrap items-center gap-2 rounded-[2rem] bg-porcelain px-4 py-2.5 text-[11px] font-semibold text-text">
        <span className="tracking-label text-accent">ADoS verdict</span>
        <span aria-hidden className="h-3 w-px bg-soft-gray" />
        <span className="text-xs tracking-[0.08em]">{verdict[1]}</span>
      </p>
    );
  }

  return <p>{children}</p>;
}

const editorialComponents: Components = {
  h3: ({ children }) => renderEditorialH3(children),
  p: ({ children }) => renderEditorialParagraph(children),
};

const shoppingEditComponents: Components = {
  img: ({ src, alt }) => (
    <span className="not-prose my-7 flex justify-center rounded-lg bg-porcelain/70 p-5 md:my-9 md:p-8">
      <Image
        src={typeof src === "string" ? src : ""}
        alt={alt ?? ""}
        width={640}
        height={640}
        className="h-[280px] w-full object-contain md:h-[380px]"
      />
    </span>
  ),
  h2: ({ children }) => {
    const label = toText(children);
    const product = label.match(/^(\d+)\.\s+(.+)$/);
    if (!product) {
      return (
        <h2 id={slugify(label)} className="scroll-mt-24">
          {children}
        </h2>
      );
    }
    return (
      <div className="not-prose mt-16 border-t border-soft-gray pt-8 first:mt-0 md:mt-20 md:pt-10">
        <h2
          id={slugify(label)}
          aria-label={`${product[1]}. ${product[2]}`}
          className="scroll-mt-24 font-serif text-[1.75rem] leading-[1.12] tracking-[-0.015em] text-text md:text-[2.25rem]"
        >
          <span
            aria-hidden
            className="mb-2 block font-sans text-[11px] font-semibold uppercase tracking-label text-accent"
          >
            Pick {product[1].padStart(2, "0")}
          </span>
          {product[2]}
        </h2>
      </div>
    );
  },
  h3: ({ children }) => renderEditorialH3(children, true),
  p: ({ children }) => {
    const label = toText(children).trim();
    const productMeta = /^(₩|Around ₩|From ₩|Price varies)/.test(label);
    if (productMeta) {
      return (
        <p className="not-prose mt-4 text-sm font-medium tracking-[0.01em] text-text-muted md:text-[15px]">
          {children}
        </p>
      );
    }

    if (label === "LOCAL SIGNAL") {
      return (
        <p className="not-prose mt-5 border-l-2 border-accent pl-3 text-[11px] font-semibold uppercase tracking-label text-accent">
          Local signal
        </p>
      );
    }

    const suitcase = label.match(/^WORTH THE SUITCASE\?\s*(.+)$/);
    if (suitcase) {
      return (
        <p className="not-prose mt-6 flex flex-wrap items-baseline gap-x-3 border-y border-soft-gray py-3 text-xs font-semibold uppercase tracking-label text-text-muted">
          <span>Worth the suitcase?</span>
          <span className="text-sm tracking-[0.12em] text-accent">
            {suitcase[1]}
          </span>
        </p>
      );
    }

    return renderEditorialParagraph(children);
  },
};

export function Prose({
  markdown,
  anchors = false,
  shoppingEdit = false,
}: {
  markdown: string;
  anchors?: boolean;
  shoppingEdit?: boolean;
}) {
  return (
    <div className="prose prose-neutral max-w-none prose-headings:font-serif prose-a:text-accent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={
          shoppingEdit
            ? shoppingEditComponents
            : anchors
              ? { ...editorialComponents, ...anchorComponents }
              : editorialComponents
        }
      >
        {normalizeEditorialMarkdown(markdown)}
      </ReactMarkdown>
    </div>
  );
}

import type { Metadata } from "next";
import { ProtoHome } from "./proto-home";

export const metadata: Metadata = {
  title: "Mobile Editorial Prototype",
  description: "A mobile-first editorial direction for A Drop of Seoul.",
  robots: { index: false, follow: false },
};

export default function ProtoPage() {
  return <ProtoHome />;
}

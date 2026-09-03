import type { Metadata } from "next";
import { MemberFlowPreview } from "./MemberFlowPreview";

export const metadata: Metadata = {
  title: "Member Flow Preview",
  robots: { index: false, follow: false },
};

export default function MemberFlowPreviewPage() {
  return <MemberFlowPreview />;
}

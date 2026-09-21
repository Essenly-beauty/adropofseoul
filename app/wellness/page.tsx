import { permanentRedirect } from "next/navigation";
export default function LegacyWellness() {
  permanentRedirect("/stories?keyword=wellness");
}

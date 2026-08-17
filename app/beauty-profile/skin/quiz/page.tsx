import type { Metadata } from "next";
import { SkinQuizClient } from "@/components/editorial/SkinQuizClient";
import { listProducts } from "@/services/products";
import type { Product } from "@/services/types";

export const metadata: Metadata = {
  title: "Skin Profile quiz",
  robots: { index: false, follow: false },
};

// Product availability is runtime data. Do not bake a temporary build-time
// Supabase outage into the quiz's product preview.
export const dynamic = "force-dynamic";

export default async function SkinQuizPage() {
  let products: Product[] = [];
  try {
    products = await listProducts({ limit: 50 });
  } catch (error) {
    console.error("skin quiz: products fetch failed", error);
  }
  return (
    <main>
      <SkinQuizClient products={products} />
    </main>
  );
}

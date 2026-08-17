import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSkinProfileSnapshot } from "@/app/actions/profile";
import { listProducts } from "@/services/products";
import { SkinResultView } from "@/components/editorial/SkinResultView";
import type { Product } from "@/services/types";

export const metadata: Metadata = {
  title: "Your Skin Profile",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SkinResultPage({
  params,
}: {
  params: { snapshot: string };
}) {
  const result = await getSkinProfileSnapshot(params.snapshot);
  if (!result.ok || !result.profile) notFound();
  let products: Product[] = [];
  try {
    products = await listProducts({ limit: 50 });
  } catch (error) {
    console.error("skin result: products fetch failed", error);
  }
  return (
    <main>
      <SkinResultView profile={result.profile} products={products} />
    </main>
  );
}

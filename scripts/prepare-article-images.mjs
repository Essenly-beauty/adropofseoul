// Downloads and normalizes the first Skincare Like a Local article images.
// Requires network access. Outputs JPGs under public/images/articles/.
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/images/articles");
const tmpDir = join(tmpdir(), "adropofseoul-article-images");

const images = [
  {
    slug: "korean-3-step-skincare-routine",
    url: "https://images.pexels.com/photos/2087954/pexels-photo-2087954.png?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-5-step-morning-skincare-routine",
    url: "https://images.pexels.com/photos/17891763/pexels-photo-17891763.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-7-step-evening-skincare-routine",
    url: "https://images.pexels.com/photos/8990463/pexels-photo-8990463.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-skip-care-explained",
    url: "https://images.pexels.com/photos/4857813/pexels-photo-4857813.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "toner-pads-as-mini-masks",
    url: "https://images.pexels.com/photos/6619517/pexels-photo-6619517.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "glass-skin-without-10-steps",
    url: "https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-barrier-repair-routine",
    url: "https://images.pexels.com/photos/4672599/pexels-photo-4672599.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "sunscreen-as-skincare-korean-routine",
    url: "https://images.pexels.com/photos/8384649/pexels-photo-8384649.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-summer-cooling-skincare-routine",
    url: "https://images.pexels.com/photos/16770366/pexels-photo-16770366.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-skincare-30s-slow-aging-routine",
    url: "https://images.pexels.com/photos/33794143/pexels-photo-33794143.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-clinic-to-home-skincare",
    url: "https://images.pexels.com/photos/7446659/pexels-photo-7446659.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-post-treatment-recovery-skincare-routine",
    url: "https://images.pexels.com/photos/32078961/pexels-photo-32078961.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
];

mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

for (const image of images) {
  const res = await fetch(image.url);
  if (!res.ok) throw new Error(`${image.slug}: ${res.status}`);

  const source = join(tmpDir, `${image.slug}.source`);
  const output = join(outDir, `${image.slug}.jpg`);
  writeFileSync(source, Buffer.from(await res.arrayBuffer()));

  const result = spawnSync(
    "sips",
    [
      "-s",
      "format",
      "jpeg",
      "-s",
      "formatOptions",
      "82",
      "--resampleHeightWidthMax",
      "1800",
      source,
      "--out",
      output,
    ],
    { encoding: "utf8" }
  );

  if (result.status !== 0) {
    throw new Error(`${image.slug}: ${result.stderr || result.stdout}`);
  }

  console.log(output);
}

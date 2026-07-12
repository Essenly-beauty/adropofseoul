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
    url: "https://images.pexels.com/photos/5468646/pexels-photo-5468646.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-5-step-morning-skincare-routine",
    url: "https://images.pexels.com/photos/9774785/pexels-photo-9774785.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-7-step-evening-skincare-routine",
    url: "https://images.pexels.com/photos/12322901/pexels-photo-12322901.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-skip-care-explained",
    url: "https://images.pexels.com/photos/8159665/pexels-photo-8159665.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "toner-pads-as-mini-masks",
    url: "https://images.pexels.com/photos/6978058/pexels-photo-6978058.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "glass-skin-without-10-steps",
    url: "https://images.pexels.com/photos/9774669/pexels-photo-9774669.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-barrier-repair-routine",
    url: "https://images.pexels.com/photos/8076212/pexels-photo-8076212.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "sunscreen-as-skincare-korean-routine",
    url: "https://images.pexels.com/photos/6977734/pexels-photo-6977734.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-summer-cooling-skincare-routine",
    url: "https://images.pexels.com/photos/6543629/pexels-photo-6543629.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-skincare-30s-slow-aging-routine",
    url: "https://images.pexels.com/photos/9774551/pexels-photo-9774551.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-clinic-to-home-skincare",
    url: "https://images.pexels.com/photos/8076172/pexels-photo-8076172.jpeg?auto=compress&cs=tinysrgb&w=2200",
  },
  {
    slug: "korean-post-treatment-recovery-skincare-routine",
    url: "https://images.pexels.com/photos/9642840/pexels-photo-9642840.jpeg?auto=compress&cs=tinysrgb&w=2200",
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

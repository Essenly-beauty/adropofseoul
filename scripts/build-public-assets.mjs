import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Keep file-existence checks out of runtime code: tracing a dynamic fs path
// under public otherwise copies every static image into server functions.
function collect(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      return collect(join(directory, entry.name), `${relative}/`);
    }
    return entry.isFile() ? [relative] : [];
  });
}

const assets = collect(join(process.cwd(), "public")).sort();
writeFileSync(
  join(process.cwd(), "data", "public-assets.json"),
  JSON.stringify(assets, null, 2) + "\n"
);
console.log(`Indexed ${assets.length} public assets.`);

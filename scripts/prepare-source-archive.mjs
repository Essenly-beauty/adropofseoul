import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";

const DEFAULT_INPUT = "/Users/jj_whatap/Downloads/아카이브 3";
const DEFAULT_OUTPUT = "content/source-archives/archive-3";

const TABLE_FILES = {
  brands: "brands_rows.json",
  clinics: "clinics_rows.json",
  clinicTreatments: "clinic_treatments_rows.json",
  ingredients: "ingredients_rows.json",
  productIngredients: "product_ingredients_rows.json",
  productStores: "product_stores_rows.json",
  products: "products_rows.json",
  stores: "stores_rows.json",
  treatments: "treatments_rows.json",
};

const args = process.argv.slice(2);
const inputDir = valueFor("--input") ?? DEFAULT_INPUT;
const outputDir = valueFor("--out") ?? DEFAULT_OUTPUT;

function valueFor(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function parseJsonFile(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function parseMaybeJson(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalizeValue(value) {
  const parsed = parseMaybeJson(value);
  if (Array.isArray(parsed)) return parsed.map(normalizeValue);
  if (parsed && typeof parsed === "object") {
    return Object.fromEntries(
      Object.entries(parsed).map(([key, entry]) => [key, normalizeValue(entry)])
    );
  }
  return parsed;
}

function normalizeRow(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, normalizeValue(value)])
  );
}

function rowName(row) {
  const name = normalizeValue(row.name);
  if (name && typeof name === "object" && !Array.isArray(name)) {
    return name.en ?? name.ko ?? Object.values(name)[0] ?? null;
  }
  return name ?? null;
}

function nonemptyCounts(rows) {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return Object.fromEntries(
    keys.map((key) => [
      key,
      rows.filter((row) => {
        const value = row[key];
        return value !== null && value !== undefined && value !== "";
      }).length,
    ])
  );
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function duplicateNames(rows) {
  const counts = new Map();
  for (const row of rows) {
    const name = rowName(row);
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));
}

function missingRefs(rows, key, targets) {
  const targetIds = new Set(targets.map((row) => row.id));
  return rows
    .filter((row) => row[key] && !targetIds.has(row[key]))
    .map((row) => row[key]);
}

function domains(rows, key) {
  return unique(
    rows.map((row) => {
      try {
        return row[key] ? new URL(row[key]).hostname : null;
      } catch {
        return null;
      }
    })
  );
}

function tableSummary(name, rows) {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))].sort();
  return {
    rows: rows.length,
    keys,
    nonempty: nonemptyCounts(rows),
    statuses: unique(rows.map((row) => row.status)),
    duplicate_names: duplicateNames(rows),
  };
}

if (!existsSync(inputDir)) {
  throw new Error(`Input directory not found: ${inputDir}`);
}

const foundFiles = new Set(readdirSync(inputDir));
for (const file of Object.values(TABLE_FILES)) {
  if (!foundFiles.has(file)) throw new Error(`Missing required file: ${file}`);
}

const rawTables = Object.fromEntries(
  Object.entries(TABLE_FILES).map(([table, file]) => [
    table,
    parseJsonFile(join(inputDir, file)),
  ])
);

const tables = Object.fromEntries(
  Object.entries(rawTables).map(([table, rows]) => [
    table,
    rows.map((row) => normalizeRow(row)),
  ])
);

const report = {
  generated_at: new Date().toISOString(),
  input_dir: inputDir,
  output_dir: outputDir,
  source_files: Object.fromEntries(
    Object.entries(TABLE_FILES).map(([table, file]) => [table, basename(file)])
  ),
  tables: Object.fromEntries(
    Object.entries(tables).map(([table, rows]) => [
      table,
      tableSummary(table, rows),
    ])
  ),
  vocabularies: {
    product_categories: unique(tables.products.map((row) => row.category)),
    product_subcategories: unique(
      tables.products.map((row) => row.subcategory)
    ),
    store_types: unique(tables.stores.map((row) => row.store_type)),
    clinic_types: unique(tables.clinics.map((row) => row.clinic_type)),
    treatment_categories: unique(tables.treatments.map((row) => row.category)),
    ingredient_functions: unique(
      tables.ingredients.flatMap((row) => row.function ?? [])
    ),
    product_price_sources: unique(
      tables.products.map((row) => row.price_source)
    ),
    treatment_price_sources: unique(
      tables.treatments.map((row) => row.price_source)
    ),
    product_source_domains: domains(tables.products, "price_source_url"),
  },
  references: {
    missing_product_brand_ids: missingRefs(
      tables.products,
      "brand_id",
      tables.brands
    ),
    missing_product_ingredient_product_ids: missingRefs(
      tables.productIngredients,
      "product_id",
      tables.products
    ),
    missing_product_ingredient_ingredient_ids: missingRefs(
      tables.productIngredients,
      "ingredient_id",
      tables.ingredients
    ),
    missing_product_store_product_ids: missingRefs(
      tables.productStores,
      "product_id",
      tables.products
    ),
    missing_product_store_store_ids: missingRefs(
      tables.productStores,
      "store_id",
      tables.stores
    ),
    missing_clinic_treatment_clinic_ids: missingRefs(
      tables.clinicTreatments,
      "clinic_id",
      tables.clinics
    ),
    missing_clinic_treatment_treatment_ids: missingRefs(
      tables.clinicTreatments,
      "treatment_id",
      tables.treatments
    ),
  },
  recommendation: {
    import_mode: "staging_only",
    first_public_slice:
      "ingredient_glossary_drafts_with_product_source_support",
    notes: [
      "Do not overwrite public products or ingredients from this archive.",
      "Promote rows only after source verification and editorial rewriting.",
      "Products with Olive Young source URLs are the strongest immediate evidence set.",
      "Clinic and treatment rows require higher verification before publication.",
    ],
  },
};

const normalized = {
  metadata: {
    generated_at: report.generated_at,
    input_dir: inputDir,
    source_files: report.source_files,
    import_mode: "staging_only",
  },
  tables,
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(
  join(outputDir, "normalized.json"),
  JSON.stringify(normalized, null, 2)
);
writeFileSync(join(outputDir, "audit.json"), JSON.stringify(report, null, 2));

console.log(`Wrote ${join(outputDir, "normalized.json")}`);
console.log(`Wrote ${join(outputDir, "audit.json")}`);
console.log(
  JSON.stringify(
    {
      tables: Object.fromEntries(
        Object.entries(report.tables).map(([table, summary]) => [
          table,
          summary.rows,
        ])
      ),
      missing_refs: Object.fromEntries(
        Object.entries(report.references).map(([key, values]) => [
          key,
          values.length,
        ])
      ),
      product_source_domains: report.vocabularies.product_source_domains,
      recommendation: report.recommendation.first_public_slice,
    },
    null,
    2
  )
);

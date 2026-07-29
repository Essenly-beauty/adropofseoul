// Empty stub used by vitest to resolve side-effect-only imports that exist to
// mark server modules (e.g. `import "server-only"`). Next.js aliases these to an
// empty module at build time; vitest has no such alias, so the raw package would
// fail to resolve (or throw) under test. Mapping it here lets server-only modules
// be imported and unit-tested directly.
export {};

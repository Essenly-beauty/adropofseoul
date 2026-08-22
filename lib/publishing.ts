/**
 * Temporary publication gates used while the site is prepared for AdSense
 * review. Keep these decisions in one place so content can be restored without
 * deleting database rows or editorial work.
 */
export const PLACES_DIRECTORY_PUBLIC = false;

const HIDDEN_POST_SLUGS = new Set(["five-k-beauty-serums"]);

export function isPostPublic(slug: string): boolean {
  return !HIDDEN_POST_SLUGS.has(slug);
}

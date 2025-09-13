/**
 * Generate a slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate a unique field key from label
 */
export function generateFieldKey(label: string, existingKeys: string[]): string {
  const baseSlug = generateSlug(label);
  let slug = baseSlug;
  let counter = 1;

  while (existingKeys.includes(slug)) {
    slug = `${baseSlug}_${counter}`;
    counter++;
  }

  return slug;
}

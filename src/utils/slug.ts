// UUID generator - inline to avoid import issues
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generate a URL-friendly slug from a book title and optional ISBN.
 * Format: "the-great-gatsby-9780743273565" (title + ISBN)
 * Or: "the-great-gatsby-a1b2c3d4" (title + short hash from UUID)
 */
export function generateBookSlug(title: string, isbn?: string): string {
  // Convert to lowercase and remove special characters
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars but keep spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens

  // Append ISBN if available, otherwise append short hash from UUID
  if (isbn && isbn.replace(/[- ]/g, '').length >= 10) {
    // Use clean ISBN (remove dashes and spaces)
    const cleanIsbn = isbn.replace(/[- ]/g, '')
    return `${slug}-${cleanIsbn}`
  }

  // Generate a short 8-character hash from a UUID
  const hash = generateId().replace(/-/g, '').substring(0, 8)
  return `${slug}-${hash}`
}

/**
 * Check if a string looks like a UUID (for legacy URL detection)
 */
export function isUUID(str: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidPattern.test(str)
}

// Navigation utilities with basepath support

export const BASE_PATH = '/booknotes-pwa';

/**
 * Creates a full path with basepath prefix
 * @param path - Relative path (e.g., '/books/123')
 * @returns Full path with basepath (e.g., '/booknotes-pwa/books/123')
 */
export function createFullPath(path: string): string {
  if (!path) return BASE_PATH;
  
  if (path.startsWith(BASE_PATH)) {
    return path;
  }
  
  if (path.startsWith('/')) {
    return `${BASE_PATH}${path}`;
  }
  
  return `${BASE_PATH}/${path}`;
}

/**
 * Navigate with basepath handling
 * @param navigate - React Router navigate function
 * @param path - Target path (can be relative or absolute)
 * @param options - Navigation options (optional)
 */
export function navigateWithBasepath(navigate: (path: string, options?: { replace?: boolean }) => void, path: string, options?: { replace?: boolean }): void {
  if (path.startsWith(BASE_PATH)) {
    navigate(path, options);
  } else if (path.startsWith('/')) {
    navigate(createFullPath(path), options);
  } else {
    navigate(`${BASE_PATH}/${path}`, options);
  }
}
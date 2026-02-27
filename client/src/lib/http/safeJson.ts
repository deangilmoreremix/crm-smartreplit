/**
 * Safe JSON parsing utility to prevent crashes when server returns HTML/404 instead of JSON
 */

/**
 * Custom error class for HTTP errors with status and preview
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public preview: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Parse response safely - reads text first, validates status and content-type, then parses JSON
 * @param response - Fetch Response object
 * @returns Parsed JSON object
 * @throws HttpError if response is not OK
 * @throws SyntaxError if response is not valid JSON
 */
export async function safeJson<T = unknown>(response: Response): Promise<T> {
  // First read the response as text
  const text = await response.text();

  // Check if response was successful
  if (!response.ok) {
    const preview = text.slice(0, 200);
    throw new HttpError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      preview
    );
  }

  // Check content-type header for JSON
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // If not JSON, throw with preview
    const preview = text.slice(0, 200);
    throw new HttpError(
      `Expected JSON but got ${contentType || 'unknown content-type'}`,
      response.status,
      preview
    );
  }

  // Try to parse JSON
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    const preview = text.slice(0, 200);
    throw new HttpError(
      `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown parse error'}`,
      response.status,
      preview
    );
  }
}

/**
 * Simple fetch wrapper that automatically uses safeJson
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Parsed JSON response
 */
export async function safeFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  return safeJson<T>(response);
}

export default safeJson;

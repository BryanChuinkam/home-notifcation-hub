export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers } });
  if (!response.ok) {
    let message = "The request could not be completed. Please try again.";
    try { message = (await response.json()).error ?? message; } catch {}
    throw new Error(message);
  }
  return response.status === 204 ? undefined as T : response.json();
}
export function errorText(error: unknown) { return error instanceof Error ? error.message : "Couldn't reach the hub. Please try again."; }

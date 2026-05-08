type JsonResult<T> = {
  response: Response;
  body: T | null;
};

function abortMessage(timeoutMs: number) {
  return `Anfrage nach ${Math.round(timeoutMs / 1000)} Sekunden abgebrochen. Bitte erneut versuchen.`;
}

export async function fetchJsonWithTimeout<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 12000
): Promise<JsonResult<T>> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(new Error(abortMessage(timeoutMs))), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: init.signal ?? controller.signal,
    });
    const body = (await response.json().catch(() => null)) as T | null;
    return { response, body };
  } catch (error) {
    if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw new Error(abortMessage(timeoutMs));
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

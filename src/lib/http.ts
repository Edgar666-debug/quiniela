type JsonObject = Record<string, unknown>;

export async function readJsonResponse<T extends JsonObject>(response: Response) {
  return (await response.json().catch(() => ({}))) as T;
}

export async function fetchJsonOrThrow<T extends JsonObject>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackError = "No se pudo cargar la información.",
) {
  const response = await fetch(input, init);
  const data = await readJsonResponse<T & { error?: string }>(response);

  if (!response.ok) {
    throw new Error(data.error ?? fallbackError);
  }

  return data as T;
}

export async function sendJsonRequest<T extends JsonObject>(
  input: RequestInfo | URL,
  init?: Omit<RequestInit, "body" | "headers"> & {
    body?: JsonObject;
    headers?: HeadersInit;
  },
) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const data = await readJsonResponse<T>(response);

  return { response, data };
}

const DEFAULT_MESSAGES = {
  400: "The transaction filters are invalid. Check the dates and services.",
  401: "Please sign in again to view your transactions.",
  403: "We could not verify access to your connected transaction account.",
};
const DEFAULT_API_BASE_URL = "https://e-tarrif-be.onrender.com/api";

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function buildUrl(path, query) {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

  let url;
  try {
    url = new URL(
      path.replace(/^\/+/, ""),
      `${baseUrl.replace(/\/+$/, "")}/`,
    );
  } catch {
    throw new ApiError(
      0,
      "API_CONFIGURATION",
      "The transactions service URL is invalid.",
    );
  }

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function getErrorDetails(body, status) {
  const details =
    body && typeof body === "object" && !Array.isArray(body)
      ? body.error
      : null;
  const code =
    details && typeof details.code === "string"
      ? details.code
      : status === 401
        ? "UNAUTHENTICATED"
        : status === 403
          ? "SIMCLOUD_ACCESS_DENIED"
          : status === 400
            ? "INVALID_REQUEST"
            : "REQUEST_FAILED";
  const message =
    status >= 500
      ? "The transaction service is temporarily unavailable. Please try again."
      : details && typeof details.message === "string"
        ? details.message
        : DEFAULT_MESSAGES[status] ??
          "We could not retrieve your transactions. Please try again.";

  return { code, message };
}

export async function apiFetch(path, { query, signal, ...options } = {}) {
  const url = buildUrl(path, query);
  let response;

  try {
    response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "The transaction service could not be reached. Please try again.",
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "The transaction service returned an invalid response.",
    );
  }

  if (!response.ok) {
    const { code, message } = getErrorDetails(body, response.status);
    throw new ApiError(response.status, code, message);
  }

  return body;
}

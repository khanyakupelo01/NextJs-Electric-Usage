export const SESSION_USER_KEY = "session";

export function getStableUserId(userId) {
  if (typeof userId === "string" && userId.trim()) {
    return userId.trim();
  }

  if (typeof userId === "number" && Number.isFinite(userId)) {
    return String(userId);
  }

  return null;
}

export function getQueryUserId(userId) {
  return getStableUserId(userId) ?? SESSION_USER_KEY;
}

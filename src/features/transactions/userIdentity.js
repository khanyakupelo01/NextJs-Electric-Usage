export function getStableUserId(userId) {
  if (typeof userId === "string" && userId.trim()) {
    return userId.trim();
  }

  if (typeof userId === "number" && Number.isFinite(userId)) {
    return String(userId);
  }

  return null;
}

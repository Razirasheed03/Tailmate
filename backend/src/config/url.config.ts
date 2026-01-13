function validateUrl(url: string, name: string): string {
  if (!url) {
    throw new Error(`${name} is required`);
  }

  const isLocalhost =
    url.startsWith("http://localhost") ||
    url.startsWith("http://127.0.0.1");

  if (!isLocalhost && !url.startsWith("https://")) {
    throw new Error(`${name} must start with https:// (except localhost)`);
  }

  return url.replace(/\/$/, "");
}

export const getFrontendUrl = (): string => {
  const rawUrl =
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://tailmate-care.vercel.app"
      : "http://localhost:3000");

  if (!rawUrl) {
    throw new Error("FRONTEND_URL is required");
  }

  return validateUrl(rawUrl, "FRONTEND_URL");
};

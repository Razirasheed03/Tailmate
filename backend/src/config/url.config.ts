function validateUrl(url: string, name: string): string {
  if (!url) {
    throw new Error(`${name} is required`);
  }

  if (!url.startsWith("https://")) {
    throw new Error(`${name} must start with https://`);
  }

  return url.replace(/\/$/, ""); // remove trailing slash
}

export const getFrontendUrl = (): string => {
  return validateUrl(
    process.env.FRONTEND_URL || process.env.FRONTEND_BASE_URL || "",
    "FRONTEND_URL"
  );
};

export const AUTH_ERROR_MESSAGES: Record<string, { title: string; body: string }> = {
  AccessDenied: {
    title: "Access denied",
    body:
      "Google blocked sign-in. If your OAuth app is in Testing mode, add your Google email under Google Cloud → OAuth consent screen → Test users. Also confirm the production redirect URI is registered.",
  },
  DatabaseError: {
    title: "Database unavailable",
    body:
      "Google sign-in succeeded, but the server could not save your account. Check DATABASE_URL on production, MySQL connectivity, and server logs.",
  },
  NoEmail: {
    title: "Email not provided",
    body:
      "Google did not return an email for this account. Try another Google account or ensure the OAuth app requests the email scope.",
  },
  Configuration: {
    title: "Auth configuration error",
    body:
      "Check AUTH_SECRET, AUTH_URL, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET on your production host. AUTH_URL must be https://masterprompt.yasirali.io",
  },
  OAuthCallbackError: {
    title: "OAuth callback failed",
    body:
      "The OAuth callback failed. Verify redirect URIs in Google Cloud include https://masterprompt.yasirali.io/api/auth/callback/google",
  },
  Default: {
    title: "Sign-in failed",
    body: "Something went wrong during sign-in. Try again or check server logs.",
  },
};

export function getAuthErrorMessage(code: string | null) {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] ?? {
    ...AUTH_ERROR_MESSAGES.Default,
    body: `${AUTH_ERROR_MESSAGES.Default.body} (error: ${code})`,
  };
}

import { createNestablePublicClientApplication, type IPublicClientApplication } from "@azure/msal-browser";

declare const Office: any;

const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID || "";
const tenantId = import.meta.env.VITE_MICROSOFT_TENANT_ID || "";

let msalApp: IPublicClientApplication | null = null;

/**
 * Acquires a Microsoft Graph-scoped access token for the signed-in
 * Outlook user (User.Read + Mail.Read only — no write scopes). This is
 * ONLY used to read live mailbox content; it is a separate concern from
 * "who is this person in SpikeOS" (see identity.ts), and the backend
 * never treats possession of a Graph token as proof of SpikeOS identity.
 *
 * Returns null if Microsoft credentials aren't configured, or if consent
 * hasn't been granted yet — callers should fall back to SpikeOS's mock
 * inbox in that case, never to fabricated data pretending to be real.
 */
export async function getGraphAccessToken(): Promise<string | null> {
  if (!clientId || !tenantId) {
    console.warn("[SpikeOS] VITE_MICROSOFT_CLIENT_ID / VITE_MICROSOFT_TENANT_ID not set at build time. ");
    return null;
  };

  try {
    if (!msalApp) {
      msalApp = await createNestablePublicClientApplication({
        auth: {
          clientId,
          authority: `https://login.microsoftonline.com/${tenantId}`,
          supportsNestedAppAuth: true,
        },
      });
    }

    const result = await msalApp.acquireTokenSilent({
      scopes: ["User.Read", "Mail.Read"],
    });
    return result.accessToken || null;
  } catch (silentError) {
    // NAA can require interactive consent the first time. Use a popup only
    // when Outlook/MSAL reports that silent acquisition needs interaction.
    try {
      if (msalApp) {
        const result = await msalApp.acquireTokenPopup({
          scopes: ["User.Read", "Mail.Read"],
        });
        return result.accessToken || null;
      }
    } catch {
      // Fall through to the mock inbox path below.
    }
    void silentError;
  }

  // Compatibility fallback for Outlook builds that support Office SSO but
  // not NAA yet.
  if (Office?.auth?.getAccessTokenAsync) {
    return new Promise((resolve) => {
      Office.auth.getAccessTokenAsync(
        { allowSignInPrompt: true, allowConsentPrompt: true },
        (result: any) => {
          resolve(result?.status === Office.AsyncResultStatus.Succeeded ? result.value : null);
        },
      );
    });
  }

  return null;
}

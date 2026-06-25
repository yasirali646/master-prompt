import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, createPageMetadata, siteConfig } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "How Master Prompt handles your data, API keys, local storage, MySQL account data, and OAuth sign-in.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Privacy Policy",
          description: "Privacy policy for Master Prompt.",
          url: absoluteUrl("/privacy"),
          isPartOf: { "@type": "WebSite", name: siteConfig.name },
        }}
      />
      <LegalLayout title="Privacy Policy" updated="June 24, 2026">
      <p>
        Master Prompt (&quot;we&quot;, &quot;our&quot;, or &quot;the application&quot;) is a tool that helps you
        generate structured, state-machine system prompts. This Privacy Policy explains how we
        handle information when you use our application.
      </p>

      <h2>Our core commitment: we do not store your personal API keys</h2>
      <p>
        <strong>
          We do not collect, store, or retain your LLM provider API keys on our servers.
        </strong>{" "}
        When you enter an API key in Settings, it is saved{" "}
        <strong>locally in your browser only</strong> (using your device&apos;s local storage).
      </p>
      <p>
        Before being saved, your API keys are protected using encryption and hashing so they are
        not stored in plain text on your device. A one-way hash may also be used internally for
        fingerprinting and integrity checks without exposing the original key.
      </p>
      <p>
        API keys are sent to our application server <em>only at the moment you run a generation</em>,
        solely to forward your request to your chosen AI provider (OpenAI, Anthropic, Google, or Groq).
        They are used in memory for that request and are <strong>not written to disk</strong> on the server.
      </p>

      <h2>Information we do not collect</h2>
      <ul>
        <li>API keys (not persisted on our servers)</li>
        <li>Payment or billing information (the app does not process payments)</li>
        <li>Precise geolocation data</li>
        <li>Advertising identifiers or cross-site tracking data</li>
      </ul>

      <h2>Where your data is stored</h2>
      <p>
        <strong>Without signing in:</strong> your settings, generation history, custom templates,
        and usage stats are stored <strong>locally in your browser</strong> (local storage). They
        stay on your device and are not sent to our servers except when you run a generation
        (prompt text only, as described below).
      </p>
      <p>
        <strong>When signed in:</strong> your settings, history, templates, usage, and workspaces
        are stored in our <strong>MySQL database</strong>, linked to your account. When you sign
        in after using the app as a guest, locally stored data may be synced once to your account
        and then removed from local storage.
      </p>
      <p>
        <strong>API keys are never stored in MySQL or any server database.</strong> They remain
        in encrypted browser storage only, regardless of whether you are signed in.
      </p>

      <h2>Information processed locally</h2>
      <p>The following may be stored on your device:</p>
      <ul>
        <li>
          <strong>API keys</strong> — encrypted in browser local storage, as described above
          (never synced to the server database)
        </li>
        <li>
          <strong>Draft ideas</strong> — auto-saved in browser local storage for convenience
        </li>
        <li>
          <strong>Theme preference</strong> — dark or light mode stored in browser local storage
        </li>
        <li>
          <strong>Settings, history, templates, and usage</strong> — stored in browser local
          storage when you are not signed in; synced to your account database when you sign in
        </li>
      </ul>

      <h2>Account sign-in (optional)</h2>
      <p>
        Sign-in is available only through Google or GitHub. When you authenticate, we receive
        basic profile information (such as your name and email address) from the OAuth provider
        solely to authenticate you and enable workspace features. We do not sell this information
        to third parties.
      </p>

      <h2>Third-party AI providers</h2>
      <p>
        When you generate a prompt, the text you submit is sent to the AI provider you select.
        That provider&apos;s own privacy policy governs how they handle your data. We encourage you
        to review the policies of OpenAI, Anthropic, Google, and Groq before use.
      </p>

      <h2>Cookies and sessions</h2>
      <p>
        If you sign in, a session cookie may be set to keep you authenticated. This cookie does
        not contain your API keys. You can sign out at any time to clear your session.
      </p>

      <h2>Data security</h2>
      <p>
        We use industry-standard practices including HTTPS in production, encrypted local storage
        for API keys, and rate limiting on API routes. No method of transmission over the Internet
        is 100% secure; you use the service at your own discretion.
      </p>

      <h2>Your rights</h2>
      <p>You may:</p>
      <ul>
        <li>Delete API keys by clearing your browser&apos;s local storage for this site</li>
        <li>Remove saved settings by clearing site data in your browser</li>
        <li>Sign out to end your authenticated session</li>
        <li>Stop using the application at any time</li>
      </ul>

      <h2>Children&apos;s privacy</h2>
      <p>
        Master Prompt is not directed at children under 13. We do not knowingly collect personal
        information from children.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top
        of this page will reflect the most recent revision.
      </p>

      <h2>Contact</h2>
      <p>
        If you have questions about this Privacy Policy, please contact us through the repository
        or support channel associated with your deployment of Master Prompt.
      </p>
    </LegalLayout>
    </>
  );
}

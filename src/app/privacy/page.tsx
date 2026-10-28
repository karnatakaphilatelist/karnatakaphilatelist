import type { Metadata } from "next";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/constants";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={LEGAL_LAST_UPDATED}>
      <p>
        Philatelist helps you find post offices on the map and keep a record of
        the ones you have visited. This page explains what we keep about you and why, in plain
        words.
      </p>

      <LegalSection heading="What we collect">
        <LegalList
          items={[
            <>
              <strong>Your account.</strong> If you sign in, we receive your email address and, with
              Google, your name and profile photo.
            </>,
            <>
              <strong>Your passport.</strong> The post offices you mark as visited, the date, and
              any note or stamp photo you choose to add.
            </>,
            <>
              <strong>On your own device.</strong> Stamps you collect before signing in, and your
              &quot;planned&quot; list, are kept in your browser&apos;s storage. Signing in moves
              your stamps to your account. Your planned list stays on this device only.
            </>,
          ]}
        />
        <p>
          Your location is used only when you tap &quot;Near me&quot;. It is worked out in your
          browser to sort the list and is not sent to us or stored.
        </p>
      </LegalSection>

      <LegalSection heading="How we use it">
        <p>
          To show your passport on any device, keep your notes and photos safe, and let you pick up
          where you left off. We do not sell your information and we do not show ads.
        </p>
      </LegalSection>

      <LegalSection heading="Who can see it">
        <LegalList
          items={[
            "Your notes and photos are private by default. Only you can see them.",
            "If you choose Public on a visit, its note and photo can be shown to other people.",
            "The person who runs this service can see account details and passport data in the database in order to keep it working.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Services we rely on">
        <LegalList
          items={[
            "Supabase stores accounts, visits, notes and photos.",
            "Vercel hosts the website.",
            "Google handles sign-in when you choose Continue with Google.",
            "OpenStreetMap supplies the map pictures, so it sees that your browser asked for a map area.",
            "Google Maps opens only if you tap Directions.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Cookies and browser storage">
        <p>
          We use cookies to keep you signed in, and browser storage for your guest stamps and
          planned list. We do not use advertising or tracking cookies.
        </p>
      </LegalSection>

      <LegalSection heading="Keeping and deleting your data">
        <p>
          Your information stays until you remove it. You can delete any visit, with its note and
          photo, at any time from your passport. To delete your whole account and everything in it,
          email us and we will do it.
        </p>
      </LegalSection>

      <LegalSection heading="Changes and contact">
        <p>
          If this policy changes, we will update the date at the top. Questions or requests about
          your data: <a className="font-semibold text-focus underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}

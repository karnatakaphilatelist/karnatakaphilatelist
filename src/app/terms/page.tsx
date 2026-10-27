import type { Metadata } from "next";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/constants";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated={LEGAL_LAST_UPDATED}>
      <p>
        By using Karnataka Philatelic Passport you agree to these terms. They are short on purpose.
      </p>

      <LegalSection heading="Using the service">
        <LegalList
          items={[
            "It is free to browse the map and keep a passport.",
            "Keep your sign-in to yourself and use the service lawfully.",
            "Do not try to break, overload or misuse the service or other people's accounts.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="What you add">
        <LegalList
          items={[
            "You own the notes and photos you add.",
            "Only add photos and text you have the right to share, and nothing that is unlawful, abusive or reveals other people's private details.",
            "If you mark a visit Public, you allow us to show its note and photo to other people in the app.",
            "We may remove content that breaks these terms.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Post office information">
        <p>
          Post office names, pincodes and locations are collected with care but may be out of date
          or wrong. Check before you travel. Stamp artwork and names belong to their respective
          owners.
        </p>
      </LegalSection>

      <LegalSection heading="Availability">
        <p>
          The service is provided as it is, without promises that it will always be available or
          free of errors. We may change, pause or stop it. To the extent the law allows, we are not
          liable for losses that come from using it.
        </p>
      </LegalSection>

      <LegalSection heading="Ending your use">
        <p>
          You can stop using the service at any time and ask us to delete your account. See the
          Privacy Policy for how your data is handled.
        </p>
      </LegalSection>

      <LegalSection heading="Changes and contact">
        <p>
          We may update these terms and will change the date above when we do. Questions:{" "}
          <a className="font-semibold text-focus underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}

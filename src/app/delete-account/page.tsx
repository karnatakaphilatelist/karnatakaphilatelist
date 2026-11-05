import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/constants";

export const metadata: Metadata = { title: "Delete your account" };

export default function DeleteAccountPage() {
  return (
    <LegalPage title="Delete your Philatrail account" updated={LEGAL_LAST_UPDATED}>
      <p>
        You can delete your Philatrail account and the data in it at any time. This page explains
        how, and what is removed.
      </p>

      <LegalSection heading="Delete it yourself, in the app or on the website">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Open Philatrail and sign in.</li>
          <li>
            Go to the <strong>Account</strong> tab.
          </li>
          <li>
            Tap <strong>Delete my account</strong>.
          </li>
          <li>
            Confirm with <strong>Yes, delete everything</strong>.
          </li>
        </ol>
        <p>
          It happens straight away, and it cannot be undone. The same steps work on the website at{" "}
          <Link className="font-semibold text-focus underline" href="/account">
            the Account page
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Can't sign in? Ask us to do it">
        <p>
          Email{" "}
          <a className="font-semibold text-focus underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          from the email address you signed up with, and say you want your Philatrail account
          deleted. We will delete it for you and reply to confirm.
        </p>
      </LegalSection>

      <LegalSection heading="What is deleted">
        <LegalList
          items={[
            "Your account and sign-in details, including your email address.",
            "Every stamp (visit) in your passport, with its date.",
            "Your notes and your stamp photos, including any you had marked Public.",
          ]}
        />
        <p>
          Stamps you collected as a guest, and your planned list, are kept only on your own device.
          Clearing the app&apos;s data or uninstalling the app removes them.
        </p>
      </LegalSection>

      <LegalSection heading="Just want to remove some things?">
        <p>
          You do not have to delete your whole account. You can delete any single visit, with its
          note and photo, from your passport at any time.
        </p>
      </LegalSection>

      <p className="text-sm text-muted">
        More on how we handle your information is in the{" "}
        <Link className="font-semibold text-focus underline" href="/privacy">
          Privacy Policy
        </Link>
        .
      </p>
    </LegalPage>
  );
}

import Legal from "@/components/Legal";

const CO = process.env.NEXT_PUBLIC_COMPANY_NAME || "PartPassport";
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export const metadata = { title: "Terms of Service | PartPassport" };

export default function TermsPage() {
  return (
    <Legal
      title="Terms of Service"
      updated="September 2026"
      sections={[
        { h: "The service", p: [`${CO} ("we", "us") provides software that records signed lifecycle events for aircraft parts and reviews part release certificates (such as FAA Form 8130-3 and EASA Form 1) for missing or inconsistent information. By using the service you agree to these terms.`] },
        { h: "Not an airworthiness determination", p: ["The service checks whether records are consistent. It does not determine whether a part is airworthy, eligible for installation, genuine, or compliant with any regulation. Only appropriately authorized and certificated persons can make those decisions. Never rely on the service in place of required inspections, approvals or your own procedures."] },
        { h: "AI-assisted analysis", p: ["Certificate analysis uses automated and AI-based tools that can be wrong or incomplete. Findings are prompts for human review, not proof of fraud or of correctness. You are responsible for reviewing the original documents. Safety-data matching covers only the sources we have imported, is not exhaustive, and a lack of matches does not mean a part is unaffected."] },
        { h: "Accounts and keys", p: ["You must have authority to act for the organization you register. You are responsible for activity under your account and for keeping API keys and signing keys secure. Tell us promptly if a key may be compromised."] },
        { h: "Public records", p: ["Anyone who knows a part number and serial number can look up that part's registry history, including event types, dates, the recording organization, and any attached safety-data matches. Do not enter confidential or personal information into part records."] },
        { h: "Acceptable use", p: ["Do not submit forged, altered or unlawfully obtained documents, attempt to bypass usage limits or security controls, interfere with the service, or use it to violate any law or third-party right."] },
        { h: "Plans, limits and billing", p: ["Each plan includes monthly usage allowances and fair-use limits described on our pricing page. Paid plans are billed monthly in advance through our payment processor and renew until cancelled. Fees are non-refundable except where required by law. We may change pricing with advance notice."] },
        { h: "Your data", p: ["You keep ownership of the data you submit. You grant us the rights needed to operate the service, including displaying registry records publicly as described above. We may use de-identified and aggregated data to improve the service, including fraud-detection features."] },
        { h: "Availability and disclaimers", p: ["The service is provided \"as is\" and \"as available\" without warranties of any kind, to the extent permitted by law. We do not guarantee uninterrupted or error-free operation."] },
        { h: "Limitation of liability", p: ["To the extent permitted by law, we are not liable for indirect, incidental, special or consequential damages, or for losses arising from parts installed, sold or rejected based on the service. Our total liability for any claim is limited to the fees you paid us in the 12 months before the claim."] },
        { h: "Termination", p: ["You may stop using the service at any time. We may suspend or end access for violations of these terms. Signed records that are part of another organization's part history may be retained to preserve the integrity of that history."] },
        { h: "Changes and contact", p: ["We may update these terms and will post the new date above. Continued use means you accept the changes.", EMAIL ? `Questions: ${EMAIL}` : "Contact details are provided when you sign up."] },
      ]}
    />
  );
}

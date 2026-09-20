import Legal from "@/components/Legal";

const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export const metadata = { title: "Privacy Policy | PartPassport" };

export default function PrivacyPage() {
  return (
    <Legal
      title="Privacy Policy"
      updated="September 2026"
      sections={[
        { h: "What we collect", p: ["Account and organization details (name, work contact information, and FAA/EASA certificate numbers if you provide them); part records and lifecycle events you create; results of certificate checks (extracted fields, findings, and file hashes); contact details you submit when requesting access; and basic technical data such as IP address and request logs used for security and rate limiting."] },
        { h: "Certificates and AI processing", p: ["When you upload a certificate for analysis, the document is sent over an encrypted connection to a third-party AI provider (currently Anthropic) solely to extract information and identify inconsistencies. We do not keep the PDF file itself. We store the extracted fields, the findings, the file name, and a SHA-256 hash of the file so you can prove which document was checked."] },
        { h: "Public registry", p: ["Part registry pages are public. Anyone who knows a part number and serial number can see that part's history, including the organizations that recorded events and any safety-data matches. Your certificate check reports are private unless you share the report link."] },
        { h: "How we use information", p: ["To operate and secure the service, provide support, process payments, prevent abuse, meet legal obligations, and improve the service, including with de-identified, aggregated data."] },
        { h: "Service providers", p: ["We use providers for hosting, database storage, payment processing, and AI analysis. They process data on our behalf under their own terms and security practices. We do not sell your personal information."] },
        { h: "Security", p: ["Data is transmitted over encrypted connections. Access is limited to authorized personnel and systems. No system is perfectly secure, so keep your keys and credentials safe and report suspected problems to us immediately."] },
        { h: "Retention", p: ["We keep account data while your account is active and as needed for legal and business purposes. Signed part events form a tamper-evident chain that other organizations may rely on, so they may be retained after an account closes to keep that history intact. We can delete or anonymize other personal data on request."] },
        { h: "Your choices", p: ["You can ask to access, correct or delete your personal information, subject to the retention limits above and applicable law."] },
        { h: "Contact", p: [EMAIL ? `Privacy questions: ${EMAIL}` : "Contact details are provided when you sign up."] },
      ]}
    />
  );
}

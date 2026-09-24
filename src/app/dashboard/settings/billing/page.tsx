import { redirect } from "next/navigation";

/** Legacy path: billing lives at /billing. */
export default function BillingSettingsRedirect() {
 redirect("/billing");
}

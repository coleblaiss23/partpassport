import RequestForm from "./RequestForm";

export const metadata = { title: "Request access" };

export default async function RequestAccessPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
 const { plan } = await searchParams;
 return <RequestForm source={plan?.slice(0, 30)} />;
}

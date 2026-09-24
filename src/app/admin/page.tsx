import AdminConsole from "./AdminConsole";

export const dynamic = "force-dynamic";
export const metadata = {
 title: "Admin | PartPassport",
 robots: { index: false, follow: false },
};

export default function AdminPage() {
 return <AdminConsole />;
}

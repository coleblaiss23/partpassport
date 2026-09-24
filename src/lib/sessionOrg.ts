import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, readSession } from "@/lib/session";

/** For server components: the organization behind the current browser session, or null. */
export async function getSessionOrg() {
 const id = readSession((await cookies()).get(SESSION_COOKIE)?.value);
 if (!id) return null;
 const org = await prisma.organization.findUnique({ where: { id } });
 return org?.active ? org : null;
}

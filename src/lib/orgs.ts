import { prisma } from "./prisma";
import { generateKeypair } from "./signing";
import { hashKey, newApiKey } from "./auth";
import type { PlanId } from "./planLimits";

/** Creates an organization, its signing key pair (private key returned once, never stored) and a default API key. */
export async function createOrgWithKeys(name: string, plan: PlanId = "PILOT", faaCertNumber?: string | null) {
 const { publicKey, privateKey } = generateKeypair();
 const apiKey = newApiKey();
 const org = await prisma.organization.create({
 data: {
 name, plan, publicKey, faaCertNumber: faaCertNumber ?? null,
 apiKeys: { create: { name: "Default", prefix: apiKey.slice(0, 12), hash: hashKey(apiKey) } },
 },
 });
 return { org, apiKey, privateKey };
}

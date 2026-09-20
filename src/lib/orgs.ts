import { prisma } from "@/lib/prisma";
import { generateKeypair, newApiKey, hashApiKey } from "@/lib/signing";

export async function createOrgWithKeys(name: string, plan: any = "PILOT") {
  const keypair = generateKeypair();
  const rawKey = newApiKey();
  const hashed = hashApiKey(rawKey);

  const org = await prisma.organization.create({
    data: {
      name,
      publicKey: keypair.publicKey,
      plan: plan as any,
      apiKeys: {
        create: {
          keyHash: hashed,
          name: "Default Key",
        } as any,
      },
    },
  });

  return { org, apiKey: rawKey, privateKey: keypair.privateKey };
}

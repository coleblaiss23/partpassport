import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateKeypair, newApiKey, hashApiKey } from "@/lib/signing";

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const { publicKey, privateKey } = generateKeypair();
    const apiKey = newApiKey();

    const org = await prisma.organization.create({
      data: {
        name,
        publicKey,
        apiKeys: {
          create: {
            keyHash: hashApiKey(apiKey),
            name: "Default Key",
          } as any,
        },
      },
    });

    return NextResponse.json({ org, apiKey, privateKey });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

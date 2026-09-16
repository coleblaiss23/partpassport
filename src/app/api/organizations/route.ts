import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateKeypair } from "@/lib/signing";

// POST /api/organizations — creates a new org and returns a one-time private key.
// MVP-only tradeoff: move key generation to the browser before real design-partner use.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const { publicKey, privateKey } = generateKeypair();

    const org = await prisma.organization.create({
      data: { name, publicKey },
    });

    return NextResponse.json(
      {
        organization: org,
        privateKey,
        warning: "Save this private key now — it is not stored anywhere and cannot be recovered.",
      },
      { status: 201 }
    );
  } catch (error) {
    rn NextResponse.json(
      { error: "Organization creation failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}

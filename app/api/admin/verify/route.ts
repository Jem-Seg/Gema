import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

async function verifyAdmin() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ isAdmin: false, message: "Unauthenticated" }, { status: 401 });
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ isAdmin: false, message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ isAdmin: true });
  } catch (error) {
    console.error("VERIFY ERROR:", error);
    return NextResponse.json({ isAdmin: false, message: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return verifyAdmin();
}

export async function POST(req: NextRequest) {
  return verifyAdmin();
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { secretKey } = await req.json();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérification clé de sécurité ADMIN_SECRET_KEY
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Clé incorrecte" }, { status: 403 });
    }

    // Promotion de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true, isApproved: true },
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur promu administrateur",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erreur promotion admin:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

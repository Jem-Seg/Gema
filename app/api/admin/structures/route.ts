import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import prisma from "@/lib/prisma";

// 🔥 SUPPRIMÉ : import { checkAdminStatus } from '@/lib/auth';
// ❌ Cette fonction n’existe plus et provoquait l’erreur Turbopack.

export async function GET() {
  try {
    const user = await requireAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer toutes les structures avec ministère
    const structures = await prisma.structure.findMany({
      include: {
        ministere: {
          select: {
            id: true,
            name: true,
            abreviation: true,
          },
        },
      },
      orderBy: [
        { ministere: { name: "asc" } },
        { name: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      structures,
    });
  } catch (error) {
    console.error("Erreur récupération structures:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { name, description, abreviation, ministereId } =
      await request.json();

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom de la structure est obligatoire" },
        { status: 400 }
      );
    }

    if (!ministereId || typeof ministereId !== "string") {
      return NextResponse.json(
        { error: "Le ministère est obligatoire" },
        { status: 400 }
      );
    }

    // Vérifier ministère valide
    const ministere = await prisma.ministere.findUnique({
      where: { id: ministereId },
    });

    if (!ministere) {
      return NextResponse.json(
        { error: "Ministère non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier unicité
    const existingStructure = await prisma.structure.findFirst({
      where: {
        name: name.trim(),
        ministereId,
      },
    });

    if (existingStructure) {
      return NextResponse.json(
        {
          error:
            "Une structure avec ce nom existe déjà dans ce ministère",
        },
        { status: 409 }
      );
    }

    // Création
    const newStructure = await prisma.structure.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        abreviation: abreviation?.trim() || null,
        ministereId,
      },
      include: {
        ministere: {
          select: {
            id: true,
            name: true,
            abreviation: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Structure créée avec succès",
        structure: newStructure,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création structure:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

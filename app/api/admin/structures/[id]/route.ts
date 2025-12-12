import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id } = params;
    const { name, description, abreviation, ministereId } =
      await request.json();

    if (!name || typeof name !== "string") {
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

    const structure = await prisma.structure.findUnique({ where: { id } });
    if (!structure) {
      return NextResponse.json(
        { error: "Structure non trouvée" },
        { status: 404 }
      );
    }

    const ministere = await prisma.ministere.findUnique({
      where: { id: ministereId },
    });

    if (!ministere) {
      return NextResponse.json(
        { error: "Ministère non trouvé" },
        { status: 404 }
      );
    }

    const duplicate = await prisma.structure.findFirst({
      where: {
        name: name.trim(),
        ministereId,
        NOT: { id },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "Une structure avec ce nom existe déjà dans ce ministère",
        },
        { status: 409 }
      );
    }

    const updated = await prisma.structure.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        abreviation: abreviation?.trim() || null,
        ministereId,
      },
      include: {
        ministere: {
          select: { id: true, name: true, abreviation: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Structure mise à jour avec succès",
        structure: updated,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erreur mise à jour structure:", err);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id } = params;

    const structure = await prisma.structure.findUnique({ where: { id } });

    if (!structure) {
      return NextResponse.json(
        { error: "Structure non trouvée" },
        { status: 404 }
      );
    }

    await prisma.structure.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Structure supprimée avec succès",
    });
  } catch (err) {
    console.error("Erreur suppression structure:", err);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

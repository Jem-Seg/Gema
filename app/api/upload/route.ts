import { existsSync } from "fs";
import { mkdir, writeFile, unlink } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Aucun fichier fourni' });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const ext = file.name.split('.').pop();
    const uniqueName = crypto.randomUUID() + '.' + ext;
    const filePath = join(uploadDir, uniqueName);
    const publicPath = `/uploads/${uniqueName}`;

    // Écrire le fichier sur le disque
    await writeFile(filePath, buffer);

    return NextResponse.json({ success: true, path: publicPath });
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du téléchargement du fichier'
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json({ success: false, error: 'Aucun chemin de fichier fourni' }, { status: 400 });
    }

    const filePath = join(process.cwd(), "public", path);

    if (!existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'Fichier non trouvé' }, { status: 404 });
    }

    await unlink(filePath);
    return NextResponse.json({ success: true, message: 'Fichier supprimé avec succès' });

  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du téléchargement du fichier'
    });
  }
}

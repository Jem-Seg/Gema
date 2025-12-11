import { existsSync } from "fs";
import { mkdir, writeFile, unlink } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { getUploadsDir, getPublicUploadPath } from "@/lib/uploads";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Aucun fichier fourni' });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Utiliser le dossier d'uploads configuré (local dev ou externe prod)
    const uploadDir = getUploadsDir();
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
      logger.info('Uploads', `Dossier créé: ${uploadDir}`);
    }

    const ext = file.name.split('.').pop();
    const uniqueName = crypto.randomUUID() + '.' + ext;
    const filePath = join(uploadDir, uniqueName);
    const publicPath = getPublicUploadPath(uniqueName);

    // Écrire le fichier sur le disque
    await writeFile(filePath, buffer);

    logger.info('Uploads', 'Fichier uploadé', {
      filename: uniqueName,
      size: buffer.length,
      path: filePath
    });

    return NextResponse.json({ success: true, path: publicPath });
  } catch (error) {
    logger.error('Uploads', 'Erreur upload fichier', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du téléchargement du fichier'
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { path: urlPath } = await request.json();

    if (!urlPath) {
      return NextResponse.json({ success: false, error: 'Aucun chemin de fichier fourni' }, { status: 400 });
    }

    // Extraire le nom du fichier depuis /uploads/filename.ext
    const filename = urlPath.replace('/uploads/', '');
    const uploadDir = getUploadsDir();
    const filePath = join(uploadDir, filename);

    if (!existsSync(filePath)) {
      logger.warn('Uploads', `Fichier non trouvé pour suppression: ${filePath}`);
      return NextResponse.json({ success: false, error: 'Fichier non trouvé' }, { status: 404 });
    }

    await unlink(filePath);
    
    logger.info('Uploads', 'Fichier supprimé', { filename, path: filePath });
    
    return NextResponse.json({ success: true, message: 'Fichier supprimé avec succès' });

  } catch (error) {
    logger.error('Uploads', 'Erreur suppression fichier', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la suppression du fichier'
    });
  }
}

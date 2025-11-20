-- CreateTable
CREATE TABLE "DocumentOctroi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "octroiId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentOctroi_octroiId_fkey" FOREIGN KEY ("octroiId") REFERENCES "Octroi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DocumentOctroi_octroiId_idx" ON "DocumentOctroi"("octroiId");

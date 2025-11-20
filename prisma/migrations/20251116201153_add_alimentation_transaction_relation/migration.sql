-- CreateTable
CREATE TABLE "DocumentAlimentation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alimentationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentAlimentation_alimentationId_fkey" FOREIGN KEY ("alimentationId") REFERENCES "Alimentation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "produitId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ministereId" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "fournisseurNom" TEXT,
    "fournisseurNIF" TEXT,
    "beneficiaireNom" TEXT,
    "beneficiaireTelephone" TEXT,
    "alimentationId" TEXT,
    CONSTRAINT "Transaction_ministereId_fkey" FOREIGN KEY ("ministereId") REFERENCES "Ministere" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_alimentationId_fkey" FOREIGN KEY ("alimentationId") REFERENCES "Alimentation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("beneficiaireNom", "beneficiaireTelephone", "createdAt", "fournisseurNIF", "fournisseurNom", "id", "ministereId", "produitId", "quantity", "structureId", "type") SELECT "beneficiaireNom", "beneficiaireTelephone", "createdAt", "fournisseurNIF", "fournisseurNom", "id", "ministereId", "produitId", "quantity", "structureId", "type" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_alimentationId_idx" ON "Transaction"("alimentationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DocumentAlimentation_alimentationId_idx" ON "DocumentAlimentation"("alimentationId");

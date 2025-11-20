-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Octroi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "reference" TEXT,
    "dateOctroi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "produitId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "beneficiaireNom" TEXT NOT NULL,
    "beneficiaireTelephone" TEXT,
    "motif" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'SAISIE',
    "observations" TEXT,
    "ministereId" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "createurId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Octroi_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Octroi_ministereId_fkey" FOREIGN KEY ("ministereId") REFERENCES "Ministere" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Octroi_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Octroi" ("beneficiaireNom", "beneficiaireTelephone", "createdAt", "createurId", "id", "isLocked", "ministereId", "motif", "numero", "observations", "produitId", "quantite", "statut", "structureId", "updatedAt") SELECT "beneficiaireNom", "beneficiaireTelephone", "createdAt", "createurId", "id", "isLocked", "ministereId", "motif", "numero", "observations", "produitId", "quantite", "statut", "structureId", "updatedAt" FROM "Octroi";
DROP TABLE "Octroi";
ALTER TABLE "new_Octroi" RENAME TO "Octroi";
CREATE UNIQUE INDEX "Octroi_numero_key" ON "Octroi"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

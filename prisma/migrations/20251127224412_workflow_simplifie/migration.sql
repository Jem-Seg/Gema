/*
  Warnings:

  - You are about to drop the column `structureId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `requiresStructure` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `structureId` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alimentation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" REAL NOT NULL,
    "fournisseurNom" TEXT NOT NULL,
    "fournisseurNIF" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "observations" TEXT,
    "ministereId" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "createurId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Alimentation_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Alimentation_ministereId_fkey" FOREIGN KEY ("ministereId") REFERENCES "Ministere" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Alimentation_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Alimentation" ("createdAt", "createurId", "fournisseurNIF", "fournisseurNom", "id", "isLocked", "ministereId", "numero", "observations", "prixUnitaire", "produitId", "quantite", "statut", "structureId", "updatedAt") SELECT "createdAt", "createurId", "fournisseurNIF", "fournisseurNom", "id", "isLocked", "ministereId", "numero", "observations", "prixUnitaire", "produitId", "quantite", "statut", "structureId", "updatedAt" FROM "Alimentation";
DROP TABLE "Alimentation";
ALTER TABLE "new_Alimentation" RENAME TO "Alimentation";
CREATE UNIQUE INDEX "Alimentation_numero_key" ON "Alimentation"("numero");
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ministereId" TEXT NOT NULL,
    CONSTRAINT "Category_ministereId_fkey" FOREIGN KEY ("ministereId") REFERENCES "Ministere" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("description", "id", "ministereId", "name") SELECT "description", "id", "ministereId", "name" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
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
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
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
INSERT INTO "new_Octroi" ("beneficiaireNom", "beneficiaireTelephone", "createdAt", "createurId", "dateOctroi", "id", "isLocked", "ministereId", "motif", "numero", "observations", "produitId", "quantite", "reference", "statut", "structureId", "updatedAt") SELECT "beneficiaireNom", "beneficiaireTelephone", "createdAt", "createurId", "dateOctroi", "id", "isLocked", "ministereId", "motif", "numero", "observations", "produitId", "quantite", "reference", "statut", "structureId", "updatedAt" FROM "Octroi";
DROP TABLE "Octroi";
ALTER TABLE "new_Octroi" RENAME TO "Octroi";
CREATE UNIQUE INDEX "Octroi_numero_key" ON "Octroi"("numero");
CREATE TABLE "new_Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Role" ("createdAt", "description", "id", "name") SELECT "createdAt", "description", "id", "name" FROM "Role";
DROP TABLE "Role";
ALTER TABLE "new_Role" RENAME TO "Role";
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "ministereId" TEXT,
    "roleId" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_ministereId_fkey" FOREIGN KEY ("ministereId") REFERENCES "Ministere" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "firstName", "id", "isAdmin", "isApproved", "ministereId", "name", "password", "roleId", "updatedAt") SELECT "createdAt", "email", "firstName", "id", "isAdmin", "isApproved", "ministereId", "name", "password", "roleId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "Alimentation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" REAL NOT NULL,
    "fournisseurNom" TEXT NOT NULL,
    "fournisseurNIF" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'SAISIE',
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

-- CreateTable
CREATE TABLE "Octroi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "ActionHistorique" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ancienStatut" TEXT NOT NULL,
    "nouveauStatut" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActionHistorique_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Alimentation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActionHistorique_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Octroi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Structure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ministereId" TEXT NOT NULL,
    CONSTRAINT "Structure_ministereId_fkey" FOREIGN KEY ("ministereId") REFERENCES "Ministere" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Structure" ("description", "id", "ministereId", "name") SELECT "description", "id", "ministereId", "name" FROM "Structure";
DROP TABLE "Structure";
ALTER TABLE "new_Structure" RENAME TO "Structure";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "clerkId" TEXT,
    "ministereId" TEXT,
    "structureId" TEXT,
    "roleId" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_ministereId_fkey" FOREIGN KEY ("ministereId") REFERENCES "Ministere" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("clerkId", "createdAt", "email", "firstName", "id", "isAdmin", "isApproved", "ministereId", "name", "roleId", "structureId", "updatedAt") SELECT "clerkId", "createdAt", "email", "firstName", "id", "isAdmin", "isApproved", "ministereId", "name", "roleId", "structureId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Alimentation_numero_key" ON "Alimentation"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Octroi_numero_key" ON "Octroi"("numero");

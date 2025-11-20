-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActionHistorique" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ancienStatut" TEXT NOT NULL,
    "nouveauStatut" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ActionHistorique" ("action", "ancienStatut", "createdAt", "entityId", "entityType", "id", "nouveauStatut", "observations", "userId", "userRole") SELECT "action", "ancienStatut", "createdAt", "entityId", "entityType", "id", "nouveauStatut", "observations", "userId", "userRole" FROM "ActionHistorique";
DROP TABLE "ActionHistorique";
ALTER TABLE "new_ActionHistorique" RENAME TO "ActionHistorique";
CREATE INDEX "ActionHistorique_entityType_entityId_idx" ON "ActionHistorique"("entityType", "entityId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

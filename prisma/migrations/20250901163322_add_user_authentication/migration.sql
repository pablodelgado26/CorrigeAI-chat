/*
  Warnings:

  - You are about to drop the column `generatedImageUrl` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `hasPdfDownload` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `isProofAnalysis` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `pdfContent` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `messages` table. All the data in the column will be lost.
  - Added the required column `userId` to the `conversations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Criar usuário padrão para conversas existentes
INSERT INTO "users" ("id", "name", "email", "password", "createdAt", "updatedAt") 
VALUES ('default-user-id', 'Usuário Padrão', 'admin@exemplo.com', '$2b$10$K7L/lQrQqJQjQjQqJQjQqOeKQqJQjQqJQjQqJQjQqJQjQqJQjQqJQ', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Inserir conversas existentes com userId padrão
INSERT INTO "new_conversations" ("createdAt", "id", "title", "updatedAt", "userId") 
SELECT "createdAt", "id", "title", "updatedAt", 'default-user-id' FROM "conversations";

DROP TABLE "conversations";
ALTER TABLE "new_conversations" RENAME TO "conversations";
CREATE TABLE "new_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Preservar dados importantes das mensagens existentes
INSERT INTO "new_messages" ("content", "conversationId", "id", "type", "imageUrl", "createdAt") 
SELECT 
    "content", 
    "conversationId", 
    "id", 
    "type",
    COALESCE("generatedImageUrl", "imageUrl") as "imageUrl",
    COALESCE("timestamp", CURRENT_TIMESTAMP) as "createdAt"
FROM "messages";

DROP TABLE "messages";
ALTER TABLE "new_messages" RENAME TO "messages";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

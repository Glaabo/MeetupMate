-- CreateEnum
CREATE TYPE "MeetupTheme" AS ENUM ('GENERAL', 'BOARD_GAMES', 'PEN_AND_PAPER', 'COFFEE_SOCIAL', 'OUTDOOR', 'VIDEO_GAMES', 'COOKING_POTLUCK', 'SPORTS');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "boardGameId" TEXT,
ADD COLUMN     "penAndPaperId" TEXT,
ADD COLUMN     "theme" "MeetupTheme" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "themeNotes" TEXT;

-- CreateTable
CREATE TABLE "BoardGame" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "minPlayers" INTEGER NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "playTimeMinutes" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PenAndPaperGame" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PenAndPaperGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoardGame_name_key" ON "BoardGame"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BoardGame_slug_key" ON "BoardGame"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PenAndPaperGame_name_key" ON "PenAndPaperGame"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PenAndPaperGame_slug_key" ON "PenAndPaperGame"("slug");

-- CreateIndex
CREATE INDEX "Group_theme_idx" ON "Group"("theme");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_boardGameId_fkey" FOREIGN KEY ("boardGameId") REFERENCES "BoardGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_penAndPaperId_fkey" FOREIGN KEY ("penAndPaperId") REFERENCES "PenAndPaperGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;

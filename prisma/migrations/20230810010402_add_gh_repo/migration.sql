-- CreateTable
CREATE TABLE "GhRepo" (
    "fullName" TEXT NOT NULL,
    "description" TEXT,
    "stargazersCount" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GhRepo_fullName_key" ON "GhRepo"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "GhRepo_url_key" ON "GhRepo"("url");

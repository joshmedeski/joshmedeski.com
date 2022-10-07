-- CreateTable
CREATE TABLE "Appearance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publisherId" INTEGER NOT NULL,
    "date" DATETIME,
    "imageUrl" TEXT,
    CONSTRAINT "Appearance_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppearanceRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AppearanceRoles" (
    "appearanceId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,

    PRIMARY KEY ("appearanceId", "roleId"),
    CONSTRAINT "AppearanceRoles_appearanceId_fkey" FOREIGN KEY ("appearanceId") REFERENCES "Appearance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AppearanceRoles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AppearanceRole" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Publisher" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "imageUrl" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "AppearanceRole_name_key" ON "AppearanceRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_name_key" ON "Publisher"("name");

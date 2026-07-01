-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "pass" BOOLEAN NOT NULL,
    "hint" TEXT NOT NULL DEFAULT '',
    "reportId" TEXT NOT NULL,

    CONSTRAINT "CheckItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CheckItem" ADD CONSTRAINT "CheckItem_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

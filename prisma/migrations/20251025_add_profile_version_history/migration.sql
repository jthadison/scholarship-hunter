-- CreateTable
CREATE TABLE "ProfileVersion" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "changedFields" TEXT[],
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileVersion_profileId_createdAt_idx" ON "ProfileVersion"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "ProfileVersion_createdAt_idx" ON "ProfileVersion"("createdAt");

-- AddForeignKey
ALTER TABLE "ProfileVersion" ADD CONSTRAINT "ProfileVersion_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

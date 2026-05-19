CREATE TABLE "ats_analysis_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "atsQualityScore" INTEGER NOT NULL,
    "jobMatchScore" INTEGER,
    "jobDescription" TEXT,
    "analysis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ats_analysis_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ats_analysis_history_userId_createdAt_idx" ON "ats_analysis_history"("userId", "createdAt");

ALTER TABLE "ats_analysis_history" ADD CONSTRAINT "ats_analysis_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

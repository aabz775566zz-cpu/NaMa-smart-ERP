-- CreateEnum
CREATE TYPE "AIUsageStatus" AS ENUM ('SUCCESS', 'FAILURE');

-- DropIndex
DROP INDEX "AIMessage_companyId_conversationId_createdAt_idx";

-- AlterTable
ALTER TABLE "AIMessage" ADD COLUMN     "sequence" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "AIUsageLog" ADD COLUMN     "durationMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "status" "AIUsageStatus" NOT NULL DEFAULT 'SUCCESS';

-- CreateIndex
CREATE INDEX "AIMessage_companyId_conversationId_sequence_idx" ON "AIMessage"("companyId", "conversationId", "sequence");

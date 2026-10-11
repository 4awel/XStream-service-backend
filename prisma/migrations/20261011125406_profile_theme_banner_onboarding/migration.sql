-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('DARK', 'LIGHT');

-- AlterTable
ALTER TABLE "channels" ADD COLUMN     "banner_key" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "theme" "Theme" NOT NULL DEFAULT 'DARK';

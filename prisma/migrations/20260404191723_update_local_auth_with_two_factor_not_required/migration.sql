-- CreateEnum
CREATE TYPE "auth"."TwoFactorMethod" AS ENUM ('TOTP', 'EMAIL', 'SMS');

-- AlterTable
ALTER TABLE "auth"."local_auth" ADD COLUMN     "two_factor_method" "auth"."TwoFactorMethod";

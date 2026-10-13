-- AlterTable
ALTER TABLE "messaging_message" ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "is_edited" SET DEFAULT false;

-- AlterTable
ALTER TABLE "messaging_messagereadstatus" ALTER COLUMN "read_at" SET DEFAULT CURRENT_TIMESTAMP;

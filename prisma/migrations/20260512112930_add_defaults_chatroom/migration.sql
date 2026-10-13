-- AlterTable
ALTER TABLE "chat_room" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "chat_roommember" ALTER COLUMN "joined_at" SET DEFAULT CURRENT_TIMESTAMP;

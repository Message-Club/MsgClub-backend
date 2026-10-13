/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "session" (
    "session_key" VARCHAR(40) NOT NULL,
    "session_data" TEXT NOT NULL,
    "expire_date" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("session_key")
);

-- CreateTable
CREATE TABLE "users_user" (
    "id" BIGSERIAL NOT NULL,
    "password" VARCHAR(128) NOT NULL,
    "last_login" TIMESTAMPTZ,
    "is_superuser" BOOLEAN NOT NULL,
    "username" VARCHAR(150) NOT NULL,
    "first_name" VARCHAR(150) NOT NULL,
    "last_name" VARCHAR(150) NOT NULL,
    "is_staff" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "date_joined" TIMESTAMPTZ NOT NULL,
    "email" VARCHAR(254) NOT NULL,

    CONSTRAINT "users_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_profile" (
    "id" BIGSERIAL NOT NULL,
    "avatar" VARCHAR(100),
    "status" VARCHAR(10) NOT NULL,
    "last_seen" TIMESTAMPTZ,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "users_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_room" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255),
    "is_group" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "chat_room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_roommember" (
    "id" BIGSERIAL NOT NULL,
    "role" VARCHAR(10) NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL,
    "room_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "chat_roommember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging_message" (
    "id" BIGSERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "file" VARCHAR(100),
    "timestamp" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "is_edited" BOOLEAN NOT NULL,
    "room_id" BIGINT NOT NULL,
    "sender_id" BIGINT NOT NULL,

    CONSTRAINT "messaging_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging_messagereadstatus" (
    "id" BIGSERIAL NOT NULL,
    "read_at" TIMESTAMPTZ NOT NULL,
    "message_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "messaging_messagereadstatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_expire_date_idx" ON "session"("expire_date");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_username_key" ON "users_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_email_key" ON "users_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_profile_user_id_key" ON "users_profile"("user_id");

-- CreateIndex
CREATE INDEX "chat_roommember_room_id_idx" ON "chat_roommember"("room_id");

-- CreateIndex
CREATE INDEX "chat_roommember_user_id_idx" ON "chat_roommember"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_roommember_user_id_room_id_key" ON "chat_roommember"("user_id", "room_id");

-- CreateIndex
CREATE INDEX "messaging_message_room_id_idx" ON "messaging_message"("room_id");

-- CreateIndex
CREATE INDEX "messaging_message_sender_id_idx" ON "messaging_message"("sender_id");

-- CreateIndex
CREATE INDEX "messaging_messagereadstatus_message_id_idx" ON "messaging_messagereadstatus"("message_id");

-- CreateIndex
CREATE INDEX "messaging_messagereadstatus_user_id_idx" ON "messaging_messagereadstatus"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "messaging_messagereadstatus_message_id_user_id_key" ON "messaging_messagereadstatus"("message_id", "user_id");

-- AddForeignKey
ALTER TABLE "users_profile" ADD CONSTRAINT "users_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_roommember" ADD CONSTRAINT "chat_roommember_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_roommember" ADD CONSTRAINT "chat_roommember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_message" ADD CONSTRAINT "messaging_message_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_message" ADD CONSTRAINT "messaging_message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_messagereadstatus" ADD CONSTRAINT "messaging_messagereadstatus_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messaging_message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_messagereadstatus" ADD CONSTRAINT "messaging_messagereadstatus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

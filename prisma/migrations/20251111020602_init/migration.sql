-- CreateTable
CREATE TABLE "weather_data" (
    "id" SERIAL NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "weather_desc" TEXT NOT NULL,
    "collected_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "message" TEXT NOT NULL,
    "message_type" VARCHAR(20) NOT NULL,
    "recipient_username" VARCHAR(100),
    "group_id" INTEGER,
    "sent_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_groups" (
    "id" SERIAL NOT NULL,
    "group_name" VARCHAR(100) NOT NULL,
    "created_by" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "joined_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_weather_collected_at" ON "weather_data"("collected_at" DESC);

-- CreateIndex
CREATE INDEX "idx_chat_messages_type" ON "chat_messages"("message_type");

-- CreateIndex
CREATE INDEX "idx_chat_messages_recipient" ON "chat_messages"("recipient_username");

-- CreateIndex
CREATE INDEX "idx_chat_messages_group" ON "chat_messages"("group_id");

-- CreateIndex
CREATE INDEX "idx_chat_messages_sent_at" ON "chat_messages"("sent_at" DESC);

-- CreateIndex
CREATE INDEX "idx_group_members_group" ON "group_members"("group_id");

-- CreateIndex
CREATE INDEX "idx_group_members_username" ON "group_members"("username");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_username_key" ON "group_members"("group_id", "username");

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "chat_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "chat_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

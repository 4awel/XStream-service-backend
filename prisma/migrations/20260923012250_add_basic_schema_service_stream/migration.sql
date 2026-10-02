-- CreateEnum
CREATE TYPE "TagKind" AS ENUM ('CATEGORY', 'GAME_MODE', 'FORMAT', 'MOOD', 'LANGUAGE', 'CONTENT');

-- CreateEnum
CREATE TYPE "TagGroup" AS ENUM ('GAME', 'IRL', 'TALK', 'MUSIC', 'CREATIVE', 'EDUCATION', 'ESPORTS', 'SPORTS', 'OTHER');

-- CreateEnum
CREATE TYPE "TagSource" AS ENUM ('AI', 'STREAMER', 'MODERATOR');

-- CreateEnum
CREATE TYPE "InterestSource" AS ENUM ('EXPLICIT', 'IMPLICIT');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "platform" TEXT,
    "language" TEXT,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "streamer_id" TEXT NOT NULL,
    "streamTitle" TEXT,
    "streamDescription" TEXT,
    "thumbnail_url" TEXT,
    "primary_category_id" TEXT,
    "is_live" BOOLEAN NOT NULL DEFAULT false,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "stream_key_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "TagKind" NOT NULL DEFAULT 'CONTENT',
    "group" "TagGroup",
    "is_mature" BOOLEAN NOT NULL DEFAULT false,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "external_id" TEXT,
    "viewers_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_tags" (
    "channel_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "source" "TagSource" NOT NULL DEFAULT 'AI',
    "confidence" DOUBLE PRECISION,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_tags_pkey" PRIMARY KEY ("channel_id","tag_id")
);

-- CreateTable
CREATE TABLE "user_tag_interests" (
    "user_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "source" "InterestSource" NOT NULL DEFAULT 'EXPLICIT',
    "last_interaction_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_tag_interests_pkey" PRIMARY KEY ("user_id","tag_id")
);

-- CreateTable
CREATE TABLE "follows" (
    "user_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("user_id","channel_id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "price" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_moderators" (
    "user_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by_id" TEXT,

    CONSTRAINT "channel_moderators_pkey" PRIMARY KEY ("user_id","channel_id")
);

-- CreateTable
CREATE TABLE "emojis" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "creator_id" TEXT,
    "name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "subscribers_only" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "channelModeratorUserId" TEXT,
    "channelModeratorChannelId" TEXT,

    CONSTRAINT "emojis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_icons" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "channelModeratorUserId" TEXT,
    "channelModeratorChannelId" TEXT,

    CONSTRAINT "sub_icons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_icon_selections" (
    "user_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "sub_icon_id" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_icon_selections_pkey" PRIMARY KEY ("user_id","channel_id")
);

-- CreateTable
CREATE TABLE "email_verifications" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "hash_password" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "channels_streamer_id_key" ON "channels"("streamer_id");

-- CreateIndex
CREATE UNIQUE INDEX "channels_stream_key_hash_key" ON "channels"("stream_key_hash");

-- CreateIndex
CREATE INDEX "channels_primary_category_id_is_live_idx" ON "channels"("primary_category_id", "is_live");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_external_id_key" ON "tags"("external_id");

-- CreateIndex
CREATE INDEX "tags_kind_is_visible_viewers_count_idx" ON "tags"("kind", "is_visible", "viewers_count");

-- CreateIndex
CREATE INDEX "channel_tags_tag_id_idx" ON "channel_tags"("tag_id");

-- CreateIndex
CREATE INDEX "user_tag_interests_tag_id_idx" ON "user_tag_interests"("tag_id");

-- CreateIndex
CREATE INDEX "user_tag_interests_user_id_weight_idx" ON "user_tag_interests"("user_id", "weight");

-- CreateIndex
CREATE INDEX "follows_channel_id_idx" ON "follows"("channel_id");

-- CreateIndex
CREATE INDEX "subscriptions_channel_id_status_idx" ON "subscriptions"("channel_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_channel_id_idx" ON "subscriptions"("user_id", "channel_id");

-- CreateIndex
CREATE INDEX "channel_moderators_channel_id_idx" ON "channel_moderators"("channel_id");

-- CreateIndex
CREATE INDEX "emojis_creator_id_idx" ON "emojis"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "emojis_channel_id_name_key" ON "emojis"("channel_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "sub_icons_channel_id_name_key" ON "sub_icons"("channel_id", "name");

-- CreateIndex
CREATE INDEX "sub_icon_selections_sub_icon_id_idx" ON "sub_icon_selections"("sub_icon_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_email_key" ON "email_verifications"("email");

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_streamer_id_fkey" FOREIGN KEY ("streamer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_primary_category_id_fkey" FOREIGN KEY ("primary_category_id") REFERENCES "tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_tags" ADD CONSTRAINT "channel_tags_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_tags" ADD CONSTRAINT "channel_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tag_interests" ADD CONSTRAINT "user_tag_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tag_interests" ADD CONSTRAINT "user_tag_interests_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_moderators" ADD CONSTRAINT "channel_moderators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_moderators" ADD CONSTRAINT "channel_moderators_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_moderators" ADD CONSTRAINT "channel_moderators_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emojis" ADD CONSTRAINT "emojis_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emojis" ADD CONSTRAINT "emojis_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emojis" ADD CONSTRAINT "emojis_channelModeratorUserId_channelModeratorChannelId_fkey" FOREIGN KEY ("channelModeratorUserId", "channelModeratorChannelId") REFERENCES "channel_moderators"("user_id", "channel_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_icons" ADD CONSTRAINT "sub_icons_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_icons" ADD CONSTRAINT "sub_icons_channelModeratorUserId_channelModeratorChannelId_fkey" FOREIGN KEY ("channelModeratorUserId", "channelModeratorChannelId") REFERENCES "channel_moderators"("user_id", "channel_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_icon_selections" ADD CONSTRAINT "sub_icon_selections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_icon_selections" ADD CONSTRAINT "sub_icon_selections_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_icon_selections" ADD CONSTRAINT "sub_icon_selections_sub_icon_id_fkey" FOREIGN KEY ("sub_icon_id") REFERENCES "sub_icons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

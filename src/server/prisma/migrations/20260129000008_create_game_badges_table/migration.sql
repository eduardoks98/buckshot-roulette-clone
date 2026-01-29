-- CreateTable: game_badges
CREATE TABLE `game_badges` (
    `id` VARCHAR(191) NOT NULL,
    `game_id` VARCHAR(191) NOT NULL,
    `participant_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `badge_id` VARCHAR(191) NOT NULL,
    `awarded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `game_badges_game_id_user_id_badge_id_key` ON `game_badges`(`game_id`, `user_id`, `badge_id`);
CREATE INDEX `game_badges_game_id_idx` ON `game_badges`(`game_id`);
CREATE INDEX `game_badges_participant_id_idx` ON `game_badges`(`participant_id`);
CREATE INDEX `game_badges_user_id_idx` ON `game_badges`(`user_id`);
CREATE INDEX `game_badges_badge_id_idx` ON `game_badges`(`badge_id`);

-- AddForeignKey
ALTER TABLE `game_badges` ADD CONSTRAINT `game_badges_game_id_fkey` FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `game_badges` ADD CONSTRAINT `game_badges_participant_id_fkey` FOREIGN KEY (`participant_id`) REFERENCES `game_participants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `game_badges` ADD CONSTRAINT `game_badges_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

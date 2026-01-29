-- CreateTable: user_achievements
CREATE TABLE `user_achievements` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `game_id` VARCHAR(191) NULL,
    `achievement_id` VARCHAR(191) NOT NULL,
    `unlocked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `user_achievements_user_id_achievement_id_key` ON `user_achievements`(`user_id`, `achievement_id`);
CREATE INDEX `user_achievements_user_id_idx` ON `user_achievements`(`user_id`);
CREATE INDEX `user_achievements_game_id_idx` ON `user_achievements`(`game_id`);
CREATE INDEX `user_achievements_achievement_id_idx` ON `user_achievements`(`achievement_id`);

-- AddForeignKey
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_game_id_fkey` FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

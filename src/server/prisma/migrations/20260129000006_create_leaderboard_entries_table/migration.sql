-- CreateTable: leaderboard_entries
CREATE TABLE `leaderboard_entries` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `period` ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME') NOT NULL,
    `period_start` DATETIME(3) NOT NULL,
    `period_end` DATETIME(3) NOT NULL,
    `games_played` INTEGER NOT NULL DEFAULT 0,
    `games_won` INTEGER NOT NULL DEFAULT 0,
    `win_rate` DOUBLE NOT NULL DEFAULT 0,
    `elo_gain` INTEGER NOT NULL DEFAULT 0,
    `peak_elo` INTEGER NOT NULL DEFAULT 1000,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `leaderboard_entries_user_id_period_period_start_key` ON `leaderboard_entries`(`user_id`, `period`, `period_start`);
CREATE INDEX `leaderboard_entries_user_id_idx` ON `leaderboard_entries`(`user_id`);
CREATE INDEX `leaderboard_entries_period_period_start_idx` ON `leaderboard_entries`(`period`, `period_start`);
CREATE INDEX `leaderboard_entries_elo_gain_idx` ON `leaderboard_entries`(`elo_gain` DESC);

-- AddForeignKey
ALTER TABLE `leaderboard_entries` ADD CONSTRAINT `leaderboard_entries_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

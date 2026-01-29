-- CreateTable: users
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `google_id` VARCHAR(191) NULL,
    `facebook_id` VARCHAR(191) NULL,
    `discord_id` VARCHAR(191) NULL,
    `game_user_id` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `avatar_url` VARCHAR(191) NULL,
    `is_admin` BOOLEAN NOT NULL DEFAULT false,
    `games_played` INTEGER NOT NULL DEFAULT 0,
    `games_won` INTEGER NOT NULL DEFAULT 0,
    `rounds_played` INTEGER NOT NULL DEFAULT 0,
    `rounds_won` INTEGER NOT NULL DEFAULT 0,
    `total_kills` INTEGER NOT NULL DEFAULT 0,
    `total_deaths` INTEGER NOT NULL DEFAULT 0,
    `elo_rating` INTEGER NOT NULL DEFAULT 1000,
    `rank` VARCHAR(191) NOT NULL DEFAULT 'Bronze',
    `tier` VARCHAR(191) NOT NULL DEFAULT 'Bronze',
    `division` INTEGER NULL DEFAULT 4,
    `lp` INTEGER NOT NULL DEFAULT 0,
    `mmr_hidden` INTEGER NOT NULL DEFAULT 800,
    `peak_mmr` INTEGER NOT NULL DEFAULT 800,
    `games_since_promo` INTEGER NOT NULL DEFAULT 0,
    `total_xp` INTEGER NOT NULL DEFAULT 0,
    `active_title_id` VARCHAR(191) NULL,
    `total_sawed_shots` INTEGER NOT NULL DEFAULT 0,
    `total_live_hits` INTEGER NOT NULL DEFAULT 0,
    `total_damage_dealt` INTEGER NOT NULL DEFAULT 0,
    `total_items_used` INTEGER NOT NULL DEFAULT 0,
    `expired_medicine_survived` INTEGER NOT NULL DEFAULT 0,
    `total_adrenaline_uses` INTEGER NOT NULL DEFAULT 0,
    `total_handcuff_uses` INTEGER NOT NULL DEFAULT 0,
    `total_info_item_uses` INTEGER NOT NULL DEFAULT 0,
    `items_used_bitmask` INTEGER NOT NULL DEFAULT 0,
    `best_win_streak` INTEGER NOT NULL DEFAULT 0,
    `current_win_streak` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `last_login_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `users_google_id_key` ON `users`(`google_id`);
CREATE UNIQUE INDEX `users_facebook_id_key` ON `users`(`facebook_id`);
CREATE UNIQUE INDEX `users_discord_id_key` ON `users`(`discord_id`);
CREATE UNIQUE INDEX `users_game_user_id_key` ON `users`(`game_user_id`);
CREATE UNIQUE INDEX `users_email_key` ON `users`(`email`);
CREATE UNIQUE INDEX `users_username_key` ON `users`(`username`);
CREATE INDEX `users_elo_rating_idx` ON `users`(`elo_rating` DESC);
CREATE INDEX `users_total_xp_idx` ON `users`(`total_xp` DESC);
CREATE INDEX `users_tier_division_lp_idx` ON `users`(`tier`, `division`, `lp`);
CREATE INDEX `users_mmr_hidden_idx` ON `users`(`mmr_hidden` DESC);
CREATE INDEX `users_created_at_idx` ON `users`(`created_at`);

-- CreateTable: game_participants
CREATE TABLE `game_participants` (
    `id` VARCHAR(191) NOT NULL,
    `game_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `guest_name` VARCHAR(191) NULL,
    `socket_id` VARCHAR(191) NULL,
    `reconnect_token` VARCHAR(191) NULL,
    `position` INTEGER NULL,
    `rounds_won` INTEGER NOT NULL DEFAULT 0,
    `kills` INTEGER NOT NULL DEFAULT 0,
    `deaths` INTEGER NOT NULL DEFAULT 0,
    `items_used` INTEGER NOT NULL DEFAULT 0,
    `damage_dealt` INTEGER NOT NULL DEFAULT 0,
    `damage_taken` INTEGER NOT NULL DEFAULT 0,
    `self_damage` INTEGER NOT NULL DEFAULT 0,
    `shots_fired` INTEGER NOT NULL DEFAULT 0,
    `elo_change` INTEGER NULL,
    `xp_earned` INTEGER NULL,
    `lp_change` INTEGER NULL,
    `mmr_change` INTEGER NULL,
    `was_quitter` BOOLEAN NOT NULL DEFAULT false,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `left_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `game_participants_game_id_user_id_key` ON `game_participants`(`game_id`, `user_id`);
CREATE INDEX `game_participants_game_id_idx` ON `game_participants`(`game_id`);
CREATE INDEX `game_participants_user_id_idx` ON `game_participants`(`user_id`);
CREATE INDEX `game_participants_socket_id_idx` ON `game_participants`(`socket_id`);

-- AddForeignKey
ALTER TABLE `game_participants` ADD CONSTRAINT `game_participants_game_id_fkey` FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `game_participants` ADD CONSTRAINT `game_participants_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

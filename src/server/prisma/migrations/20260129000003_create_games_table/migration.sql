-- CreateTable: games
CREATE TABLE `games` (
    `id` VARCHAR(191) NOT NULL,
    `room_code` VARCHAR(191) NOT NULL,
    `winner_id` VARCHAR(191) NULL,
    `max_players` INTEGER NOT NULL DEFAULT 4,
    `max_rounds` INTEGER NOT NULL DEFAULT 3,
    `is_ranked` BOOLEAN NOT NULL DEFAULT false,
    `has_password` BOOLEAN NOT NULL DEFAULT false,
    `password` VARCHAR(191) NULL,
    `status` ENUM('WAITING', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED') NOT NULL DEFAULT 'WAITING',
    `current_round` INTEGER NOT NULL DEFAULT 1,
    `game_state` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `started_at` DATETIME(3) NULL,
    `ended_at` DATETIME(3) NULL,
    `game_state_updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `games_room_code_key` ON `games`(`room_code`);
CREATE INDEX `games_status_idx` ON `games`(`status`);
CREATE INDEX `games_room_code_idx` ON `games`(`room_code`);
CREATE INDEX `games_created_at_idx` ON `games`(`created_at` DESC);
CREATE INDEX `games_winner_id_idx` ON `games`(`winner_id`);

-- CreateTable: rounds
CREATE TABLE `rounds` (
    `id` VARCHAR(191) NOT NULL,
    `game_id` VARCHAR(191) NOT NULL,
    `winner_id` VARCHAR(191) NULL,
    `round_number` INTEGER NOT NULL,
    `max_hp` INTEGER NOT NULL,
    `shells_live` INTEGER NOT NULL,
    `shells_blank` INTEGER NOT NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ended_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `rounds_game_id_round_number_key` ON `rounds`(`game_id`, `round_number`);
CREATE INDEX `rounds_game_id_idx` ON `rounds`(`game_id`);
CREATE INDEX `rounds_winner_id_idx` ON `rounds`(`winner_id`);

-- AddForeignKey
ALTER TABLE `rounds` ADD CONSTRAINT `rounds_game_id_fkey` FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

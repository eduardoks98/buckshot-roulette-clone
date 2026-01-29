-- CreateTable: server_logs
CREATE TABLE `server_logs` (
    `id` VARCHAR(191) NOT NULL,
    `level` ENUM('DEBUG', 'INFO', 'WARN', 'ERROR') NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `message` TEXT NOT NULL,
    `context` LONGTEXT NULL,
    `room_code` VARCHAR(10) NULL,
    `user_id` VARCHAR(191) NULL,
    `socket_id` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `server_logs_created_at_idx` ON `server_logs`(`created_at` DESC);
CREATE INDEX `server_logs_level_idx` ON `server_logs`(`level`);
CREATE INDEX `server_logs_category_idx` ON `server_logs`(`category`);
CREATE INDEX `server_logs_room_code_idx` ON `server_logs`(`room_code`);
CREATE INDEX `server_logs_user_id_idx` ON `server_logs`(`user_id`);

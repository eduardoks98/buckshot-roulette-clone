-- CreateTable: user_titles
CREATE TABLE `user_titles` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `title_id` VARCHAR(191) NOT NULL,
    `period` ENUM('WEEKLY', 'MONTHLY', 'ALL_TIME') NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `awarded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `user_titles_user_id_idx` ON `user_titles`(`user_id`);
CREATE INDEX `user_titles_user_id_is_active_idx` ON `user_titles`(`user_id`, `is_active`);
CREATE INDEX `user_titles_title_id_idx` ON `user_titles`(`title_id`);
CREATE INDEX `user_titles_expires_at_idx` ON `user_titles`(`expires_at`);

-- AddForeignKey
ALTER TABLE `user_titles` ADD CONSTRAINT `user_titles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

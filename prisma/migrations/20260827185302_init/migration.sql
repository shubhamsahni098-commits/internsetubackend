-- CreateTable
CREATE TABLE `students` (
    `id` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `education` VARCHAR(191) NULL,
    `preferredRole` VARCHAR(191) NULL,
    `preferredLocation` VARCHAR(191) NULL,
    `skills` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `students_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `id` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `officialEmail` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `industry` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `companies_officialEmail_key`(`officialEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `internships` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `skills` JSON NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `workMode` ENUM('ON_SITE', 'HYBRID', 'REMOTE') NOT NULL,
    `stipend` VARCHAR(191) NULL,
    `duration` VARCHAR(191) NOT NULL,
    `eligibility` VARCHAR(191) NOT NULL,
    `deadline` DATETIME(3) NOT NULL,
    `applicationLink` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `companyId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `internships_companyId_idx`(`companyId`),
    INDEX `internships_domain_idx`(`domain`),
    INDEX `internships_location_idx`(`location`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `applications` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED') NOT NULL DEFAULT 'APPLIED',
    `studentId` VARCHAR(191) NOT NULL,
    `internshipId` VARCHAR(191) NOT NULL,
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `applications_internshipId_idx`(`internshipId`),
    UNIQUE INDEX `applications_studentId_internshipId_key`(`studentId`, `internshipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `internships` ADD CONSTRAINT `internships_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_internshipId_fkey` FOREIGN KEY (`internshipId`) REFERENCES `internships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

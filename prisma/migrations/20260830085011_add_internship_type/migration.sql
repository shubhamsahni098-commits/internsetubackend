/*
  Warnings:

  - Added the required column `internshipType` to the `internships` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `internships` ADD COLUMN `internshipType` VARCHAR(191) NOT NULL;

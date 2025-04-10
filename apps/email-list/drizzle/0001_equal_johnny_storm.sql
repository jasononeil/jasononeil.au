CREATE TABLE `email_list_sent_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	`subject` varchar(255) NOT NULL,
	`plaintext` text NOT NULL,
	`html` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_list_sent_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `email_list_sent_emails` ADD `sent_post_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `email_list_sent_emails` DROP COLUMN `post_id`;
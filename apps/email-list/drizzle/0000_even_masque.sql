CREATE TABLE `email_list_sent_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriber_id` int NOT NULL,
	`post_id` int NOT NULL,
	`status` enum('sent','failed') NOT NULL DEFAULT 'sent',
	`sent_at` timestamp NOT NULL DEFAULT (now()),
	`error_message` varchar(255),
	CONSTRAINT `email_list_sent_emails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_list_subscriber_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriber_id` int NOT NULL,
	`category_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_list_subscriber_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_list_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(255),
	`status` enum('active','unsubscribed') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_list_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_list_subscribers_email_unique` UNIQUE(`email`)
);

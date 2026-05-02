CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event` varchar(64) NOT NULL,
	`data` text,
	`ip` varchar(64),
	`country` varchar(64),
	`userAgent` text,
	`sessionId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ip` varchar(64) NOT NULL,
	`country` varchar(64),
	`userAgent` text,
	`visitCount` int NOT NULL DEFAULT 1,
	`firstVisit` timestamp NOT NULL DEFAULT (now()),
	`lastVisit` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visitors_id` PRIMARY KEY(`id`)
);

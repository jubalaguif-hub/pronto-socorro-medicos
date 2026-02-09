CREATE TABLE `alteracoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`data` varchar(10) NOT NULL,
	`predio` varchar(100) NOT NULL,
	`setor` varchar(100) NOT NULL,
	`sai` varchar(255) NOT NULL,
	`entra` varchar(255) NOT NULL,
	`motivo` varchar(255),
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alteracoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `configApp` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chave` varchar(100) NOT NULL,
	`valor` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `configApp_id` PRIMARY KEY(`id`),
	CONSTRAINT `configApp_chave_unique` UNIQUE(`chave`)
);

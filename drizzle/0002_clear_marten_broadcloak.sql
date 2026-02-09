CREATE TABLE `operadores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario` varchar(100) NOT NULL,
	`senha` varchar(255) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320),
	`role` enum('operador','admin') NOT NULL DEFAULT 'operador',
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operadores_id` PRIMARY KEY(`id`),
	CONSTRAINT `operadores_usuario_unique` UNIQUE(`usuario`)
);

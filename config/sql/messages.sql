CREATE TABLE `messages` (
		`id_messages`	Int AUTO_INCREMENT NOT NULL UNIQUE,
		`key`			LONGTEXT NOT NULL,
		`message`		LONGTEXT NOT NULL,
		`date`          DATETIME NOT NULL,
		CONSTRAINT messages_FK PRIMARY KEY (`id_messages`)
);

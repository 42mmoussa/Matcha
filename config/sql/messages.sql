CREATE TABLE `messages` (
		`id_messages`	Int AUTO_INCREMENT NOT NULL UNIQUE,
		`key`			LONGTEXT NOT NULL,
		`message`		LONGTEXT NOT NULL,
		`date`          DATETIME NOT NULL,
		`id_usr`        INT NOT NULL,
		CONSTRAINT messages_PK PRIMARY KEY (`id_messages`),
		CONSTRAINT messages_users_FK FOREIGN KEY (`id_usr`) REFERENCES users(`id_usr`) ON DELETE CASCADE
);

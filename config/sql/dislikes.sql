CREATE TABLE `dislikes` (
		`id_dislikes`	Int AUTO_INCREMENT NOT NULL UNIQUE,
		`id_usr`		Int NOT NULL,
		`id_disliked` int(11) NOT NULL,
		CONSTRAINT dislikes_FK PRIMARY KEY (`id_dislikes`),
		CONSTRAINT dislikes_users_FK FOREIGN KEY (`id_usr`) REFERENCES users(`id_usr`)
);

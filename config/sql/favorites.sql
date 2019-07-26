CREATE TABLE `favorites` (
		`id_favorites`	Int AUTO_INCREMENT NOT NULL UNIQUE,
		`id_usr`		Int NOT NULL,
		`id_favorited` int(11) NOT NULL,
		CONSTRAINT favorites_FK PRIMARY KEY (`id_favorites`),
		CONSTRAINT favorites_users_FK FOREIGN KEY (`id_usr`) REFERENCES users(`id_usr`)
);

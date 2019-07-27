CREATE TABLE `likes` (
		`id_likes`	Int AUTO_INCREMENT NOT NULL UNIQUE,
		`id_usr`		Int NOT NULL,
		`id_liked` int(11) NOT NULL,
		CONSTRAINT likes_PK PRIMARY KEY (`id_likes`),
		CONSTRAINT likes_users_FK FOREIGN KEY (`id_usr`) REFERENCES users(`id_usr`) ON DELETE CASCADE
);

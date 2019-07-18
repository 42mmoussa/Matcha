CREATE TABLE `profiles` (
		`id_profile`	Int AUTO_INCREMENT NOT NULL UNIQUE,
		`id_usr`		Int NOT NULL UNIQUE,
		`firstname`		text NOT NULL,
		`lastname`		text NOT NULL,
		`username`		varchar(50) NOT NULL,
		`gender`		text NOT NULL,
		`age`			Int NOT NULL,
		`bio`			varchar(520),
		`orientation`	text,
		`pictures`		int(11) NOT NULL,
		`tags`			text,
		CONSTRAINT profiles_FK PRIMARY KEY (`id_profile`),
		CONSTRAINT profiles_users_FK FOREIGN KEY (`id_usr`) REFERENCES users(`id_usr`)
);

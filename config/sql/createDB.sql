CREATE TABLE `users` (
		`id_usr` int NOT NULL AUTO_INCREMENT,
		`googleID` VARCHAR(50),
		`firstname` text NOT NULL,
		`lastname` text NOT NULL,
		`username` varchar(50) NOT NULL,
		`pwd` longtext NOT NULL,
		`email` varchar(100) NOT NULL,
		`confirm` int(1) NOT NULL,
		`birthday` date NOT NULL,
		`notif`			int(1) NOT NULL DEFAULT 1,
		CONSTRAINT users_PK PRIMARY KEY (`id_usr`),
		UNIQUE KEY `username` (`username`),
		UNIQUE KEY `email` (`email`)
);

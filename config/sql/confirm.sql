CREATE TABLE `confirm` (
		`id_conf` int NOT NULL AUTO_INCREMENT,
		`id_usr` int NOT NULL,
		`confirmkey` longtext NOT NULL,
		CONSTRAINT confirm_PK PRIMARY KEY (`id_conf`),
		CONSTRAINT confirm_users_FK FOREIGN KEY (id_usr) REFERENCES users(id_usr),
		UNIQUE KEY `id_conf` (`id_conf`)
);

CREATE TABLE `matchat` (
		`id_matchat`	Int AUTO_INCREMENT NOT NULL UNIQUE,
		`id_usr1`		Int NOT NULL,
		`id_usr2` int(11) NOT NULL,
		`key` LONGTEXT NOT NULL,
		CONSTRAINT matchat_FK PRIMARY KEY (`id_matchat`)
);

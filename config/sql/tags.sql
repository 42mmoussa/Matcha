CREATE TABLE `tags` (
	`id_tags`		Int AUTO_INCREMENT NOT NULL UNIQUE,
	`name_tag`		Varchar(255) NOT NULL,
	`nb_tag`		Int,
	CONSTRAINT tags_FK PRIMARY KEY (`id_tags`)
)

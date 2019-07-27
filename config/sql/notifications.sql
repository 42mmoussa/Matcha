CREATE TABLE `notifications` (
    `id_notifications`	Int AUTO_INCREMENT NOT NULL UNIQUE PRIMARY KEY,
    `id_usr`			int NOT NULL,
    `id`			    int NOT NULL,
    `username`		    TINYTEXT NOT NULL,
    `link`		        TEXT NOT NULL,
    `msg`		        TEXT NOT NULL,
    `title`		        TEXT NOT NULL
);

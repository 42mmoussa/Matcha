CREATE TABLE USERS(
        id_usr    Int  AUTO_INCREMENT  NOT NULL UNIQUE,
        firstname Varchar (50) NOT NULL,
        lastname  Varchar (50) NOT NULL,
        username     Varchar (50) NOT NULL UNIQUE,
        passwd    Varchar (516) NOT NULL,
        email     Varchar (50) NOT NULL
	,CONSTRAINT USERS_PK PRIMARY KEY (id_usr)
);
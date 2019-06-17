# sql-require
Node.js require extension for .sql files

## Installation
`npm install sql-require`

## Example
```
-- example.sql
SELECT * FROM table1;
SELECT * FROM table2;
SELECT * FROM table3;
SELECT * FROM table4;

-- :name=insertQuery
INSERT INTO table1 (f1, f2) VALUES (1, 2);

DELIMITER $$
-- :name=changeDelimeter1
DROP PROCEDURE IF EXISTS `sp_test`$$
-- :name=changeDelimeter2
CREATE DEFINER=`user`@`%` PROCEDURE `sp_test`(
  IN Number INT
  )
    READS SQL DATA
BEGIN
  IF NUMBER = 1 THEN
      SELECT * FROM tblProduct WHERE ProductID = Number;
  ELSE
      SELECT * FROM tblProduct WHERE ProductId = 2;
  END IF;
END$$

DELIMITER ;
```

```
//example.js
require('sql-require');
var SQL = require('./example.sql');

console.log(SQL[0]); //> SELECT * FROM table1
console.log(SQL[1]); //> SELECT * FROM table2
console.log(SQL.insertQuery); //> INSERT INTO table1 (f1, f2) VALUES (1, 2)

console.log(SQL.changeDelimeter2);
/* Output:
CREATE DEFINER=`user`@`%` PROCEDURE `sp_test`(
  IN Number INT
  )
    READS SQL DATA
BEGIN
  IF NUMBER = 1 THEN
      SELECT * FROM tblProduct WHERE ProductID = Number;
  ELSE
      SELECT * FROM tblProduct WHERE ProductId = 2;
  END IF;
END
*/
```

## License
MIT
Copyright (c) 2016 Dmitriy Belyaev

CREATE TABLE tbl_Note
(
	Note_Id         VARCHAR(40)     NOT NULL PRIMARY KEY,
    Plan_Id         VARCHAR(40)     NOT NULL,
    Notes           TEXT            NOT NULL,
    Created_On      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    Updated_On      DATETIME        NULL,
    Created_By      VARCHAR(40)     NOT NULL,
    Updated_By      VARCHAR(40)     NULL 
)
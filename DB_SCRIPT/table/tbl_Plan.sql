CREATE TABLE tbl_Plan
(
	Plan_Id         VARCHAR(40)     NOT NULL PRIMARY KEY,
    User_Id         VARCHAR(40)     NOT NULL,
    Title           LONGTEXT        NOT NULL,
    Description     LONGTEXT        NOT NULL,
    Day             VARCHAR(40)     NOT NULL,
    Start_Time      DATETIME        NOT NULL,
    End_Time        DATETIME        NOT NULL,
    Created_On      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    Updated_On      DATETIME        NULL,
    Created_By      VARCHAR(40)     NOT NULL,
    Updated_By      VARCHAR(40)     NULL 
)
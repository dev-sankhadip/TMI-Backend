CREATE TABLE tbl_User
(
User_Id                 VARCHAR(40)     NOT NULL PRIMARY KEY,
First_Name               VARCHAR(30)     NOT NULL,
Last_Name                VARCHAR(30)     NOT NULL,
Email                    VARCHAR(100)    NOT NULL UNIQUE,
Password                VARCHAR(255)    NOT NULL,
Created_On               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
Updated_On               DATETIME        NULL DEFAULT NULL ,
Is_Active                VARCHAR(1)      NOT NULL DEFAULT 'Y'
);
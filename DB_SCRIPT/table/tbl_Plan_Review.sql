CREATE TABLE tbl_Plan_Review
(
	Plan_Id         VARCHAR(40)     NOT NULL UNIQUE,
    Review_Id       VARCHAR(40)     NOT NULL PRIMARY KEY,
    Percentage      INT             NOT NULL,
    Edit_Count      INT             NOT NULL DEFAULT 0,
    Created_On      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    Updated_On      DATETIME        NULL,
    Created_By      VARCHAR(40)     NOT NULL,
    Updated_By      VARCHAR(40)     NULL
)
DROP PROCEDURE IF EXISTS sp_GetPlanList;
CREATE PROCEDURE sp_GetPlanList(userId varchar(40))
BEGIN
	SELECT 
        *
    FROM 
        tbl_Plan
    WHERE 
        User_Id = userId;
    
    SELECT
        PlanReference.*
    FROM
		tbl_Plan Plan
        INNER JOIN tbl_Plan_Reference PlanReference ON Plan.Plan_Id = PlanReference.Plan_Id
    WHERE
        Plan.User_Id = userId;

    
    SELECT
        PlanBreak.*
    FROM
		tbl_Plan Plan
        INNER JOIN tbl_Plan_Break PlanBreak ON Plan.Plan_Id = PlanBreak.Plan_Id
    WHERE
        Plan.User_Id = userId;
    

    SELECT 
        Note.*
    FROM
		tbl_Plan Plan
        INNER JOIN tbl_Note Note ON Plan.Plan_Id = Note.Plan_Id
    WHERE
        Plan.User_Id = userId;

    SELECT
        Review.*
    FROM
		tbl_Plan Plan
        INNER JOIN tbl_Plan_Review Review ON Plan.Plan_Id = Review.Plan_Id
    WHERE
        Plan.User_Id = userId;
END;
DROP PROCEDURE IF EXISTS sp_DeletePlan;
CREATE PROCEDURE sp_DeletePlan(planId varchar(40))
BEGIN
    
    DELETE FROM tbl_Plan
    WHERE
    Plan_Id = planId;

    DELETE FROM tbl_Plan_Reference
    WHERE
    Plan_Id = planId;

    DELETE FROM tbl_Plan_Break
    WHERE
    Plan_Id = planId;
END;
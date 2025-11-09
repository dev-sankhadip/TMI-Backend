DROP PROCEDURE IF EXISTS sp_GetPlansOfADate;
CREATE PROCEDURE sp_GetPlansOfADate(specificDate DATE, userId VARCHAR(40))
BEGIN

    -- Declare variables for start and end datetime
    SET @start_datetime = CONCAT(specificDate, ' 00:00:00');
    SET @end_datetime = CONCAT(specificDate, ' 23:59:59');
    
    -- Fetch data from tbl_Plan
    SELECT 
        *
    FROM 
        tbl_Plan Plan
    WHERE 
        (
            (Plan.Start_Time >= @start_datetime AND Plan.Start_Time <= @end_datetime)  -- Plans starting on the specific date
            OR
            (Plan.End_Time >= @start_datetime AND Plan.End_Time <= @end_datetime)    -- Plans ending on the specific date
            OR
            (Plan.Start_Time < @start_datetime AND Plan.End_Time >= @end_datetime)   -- Plans spanning across the specific date
        )
        AND Plan.User_Id = userId;
    
    -- Fetch data from tbl_Plan_Reference
    SELECT
        PlanReference.*
    FROM
        tbl_Plan Plan
        INNER JOIN tbl_Plan_Reference PlanReference ON Plan.Plan_Id = PlanReference.Plan_Id
    WHERE
        (
            (Plan.Start_Time >= @start_datetime AND Plan.Start_Time <= @end_datetime)
            OR
            (Plan.End_Time >= @start_datetime AND Plan.End_Time <= @end_datetime)
            OR
            (Plan.Start_Time < @start_datetime AND Plan.End_Time >= @end_datetime)
        )
        AND Plan.User_Id = userId;

    -- Fetch data from tbl_Plan_Break
    SELECT
        PlanBreak.*
    FROM
        tbl_Plan Plan
        INNER JOIN tbl_Plan_Break PlanBreak ON Plan.Plan_Id = PlanBreak.Plan_Id
    WHERE
        (
            (Plan.Start_Time >= @start_datetime AND Plan.Start_Time <= @end_datetime)
            OR
            (Plan.End_Time >= @start_datetime AND Plan.End_Time <= @end_datetime)
            OR
            (Plan.Start_Time < @start_datetime AND Plan.End_Time >= @end_datetime)
        )
        AND Plan.User_Id = userId;

    -- Fetch data from tbl_Note
    SELECT 
        Note.*
    FROM
        tbl_Plan Plan
        INNER JOIN tbl_Note Note ON Plan.Plan_Id = Note.Plan_Id
    WHERE
        (
            (Plan.Start_Time >= @start_datetime AND Plan.Start_Time <= @end_datetime)
            OR
            (Plan.End_Time >= @start_datetime AND Plan.End_Time <= @end_datetime)
            OR
            (Plan.Start_Time < @start_datetime AND Plan.End_Time >= @end_datetime)
        )
        AND Plan.User_Id = userId;

END;

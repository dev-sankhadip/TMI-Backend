DROP PROCEDURE IF EXISTS sp_GetEffectivePlan;
CREATE PROCEDURE sp_GetEffectivePlan(userId varchar(40), day varchar(40))
BEGIN
    SELECT
        Plan.Title, 
        Plan.Start_Time, 
        Plan.End_Time, 
        Plan.Created_On, 
        Plan.Day, 
        Review.Percentage As Review_Percentage
    FROM
		tbl_Plan Plan
        INNER JOIN tbl_Plan_Review Review ON Plan.Plan_Id = Review.Plan_Id
    WHERE
        Plan.User_Id = userId
        AND Plan.Day = day;
END;
export const DBqueries = {
  GetPatientInfo:
    "SELECT DISTINCT tbl_Client.Name, tbl_Client.Client_Iden, tbl_Client.Client_Id FROM tbl_Client INNER JOIN tbl_User ON tbl_Client.Is_Active = 'Y' AND tbl_User.Is_Active = 'Y' AND tbl_Client.Member_Id = tbl_User.User_Id AND tbl_User.User_Id = ?",
  CreatePlan:
    'Insert Into tbl_Plan(Plan_Id, User_Id, Title, Description, Start_Time, End_Time, Day, Created_By) Values(?,?,?,?,?,?,?,?)',
  CreatePlanReference:
    'Insert Into tbl_Plan_Reference(Plan_Reference_Id, Plan_Id, HyperLink, Description, Created_By) Values(?,?,?,?,?)',
  CreatePlanBreak:
    'Insert Into tbl_Plan_Break(Plan_Id, Start_Time, End_Time, Created_By) Values(?,?,?,?)',
  DeleteAllPlanReferences: 'Delete From tbl_Plan_Reference Where Plan_Id = ?',
  DeleteAllPlanBreaks: 'Delete From tbl_Plan_Break Where Plan_Id = ?',
  UpdatePlan:
    'Update tbl_Plan SET Title = ?, Description = ?, Start_Time = ?, End_Time = ?, Day = ?, Updated_By = ?, Updated_On = CURRENT_TIMESTAMP WHERE Plan_Id = ?',
  SaveNotes:
    'Insert Into tbl_Note(Note_Id, Plan_Id, Notes, Created_By) Values(?,?,?,?)',
  UpdateNotes:
    'Update tbl_Note SET Notes = ?, Updated_On = CURRENT_TIMESTAMP, Updated_By = ? WHERE Note_Id = ?',
  DeleteNote: 'Delete From tbl_Note Where Note_Id = ?',
  FindById: 'SELECT * FROM tbl_Plan WHERE Plan_Id = ?',
  FindByNoteId: 'SELECT * FROM tbl_Note WHERE Note_Id = ?',
  FindMeetingOverlap:
    'SELECT * FROM tbl_Plan WHERE ((Start_Time BETWEEN ? AND ?) OR (End_Time BETWEEN ? AND ?) OR (? BETWEEN Start_Time AND End_Time) OR (? BETWEEN Start_Time AND End_Time));',
  FindMeetingOverlapV2:
    'SELECT * FROM tbl_Plan WHERE (Start_Time < ? AND End_Time > ?) and User_Id = ?',
  FindMeetingOverlapForUpdate:
    'SELECT * FROM tbl_Plan WHERE Plan_Id != ? AND (Start_Time < ? AND End_Time > ?)',
  FindMeetingOverlapForUpdateV2:
    'SELECT * FROM tbl_Plan WHERE Plan_Id != ? AND (Start_Time < ? AND End_Time > ?)',
  InsertPlanReview:
    'Insert Into tbl_Plan_Review(Plan_Id, Review_Id, Percentage, Created_By, Edit_Count) Values(?,?,?,?,1)',
  GetPlanReview: 'SELECT Edit_Count FROM tbl_Plan_Review WHERE Plan_Id = ?',
  UpdatePlanReview:
    'Update tbl_Plan_Review SET Percentage = ?, Updated_By = ?, Edit_Count = ?, Updated_On = CURRENT_TIMESTAMP WHERE Plan_Id = ?',
  IsPlanEnded:
    'SELECT * FROM tbl_Plan WHERE Plan_Id = ? AND End_Time < CURRENT_TIMESTAMP',
  FindByTitle: `SELECT Title, Start_Time, End_Time
         FROM tbl_plan
         WHERE Title = ?
         ORDER BY Created_On DESC
         LIMIT 1`,
  CreateUser:
    'INSERT INTO tbl_User (User_Id, First_Name, Last_Name, Email, Password) VALUES (?,?,?,?,?)',
  DoesEmailExist: 'SELECT * FROM tbl_User WHERE Email = ?',
  GetUserById:
    'SELECT User_Id, First_Name, Last_Name, Email, Created_On, Updated_On, Is_Active FROM tbl_User WHERE User_Id = ?',
  UpdateUser:
    'UPDATE tbl_User SET First_Name = ?, Last_Name = ?, Updated_On = CURRENT_TIMESTAMP WHERE User_Id = ?',
  GetUserByEmail:
    'SELECT User_Id, First_Name, Last_Name, Email, Password FROM tbl_User WHERE Email = ?',
  UpdateUserPassword: 'UPDATE tbl_User SET Password = ? WHERE Email = ?',
  GetUpcomingPlans: `
    SELECT p.*, u.Email
    FROM tbl_Plan AS p
    JOIN tbl_User AS u ON p.User_Id = u.User_Id
    WHERE TIMESTAMPDIFF(MINUTE, NOW(), p.Start_Time) BETWEEN ? AND ?
  `,
};

export const DBsp = {
  GetPlanDetails: 'call sp_GetPlanDetails(?)',
  GetPlansOfADate: 'call sp_GetPlansOfADate(?,?)',
  GetPlanList: 'call sp_GetPlanList(?)',
  DeletePlan: 'call sp_DeletePlan(?)',
  GetEffectivePlan: 'call sp_GetEffectivePlan(?,?)',
};

import { Service } from 'typedi';
import { DBqueries, DBsp } from '../Shared/dBQueries';
import DbConnection from './dbConnection';
import { PlanReference } from '../Model/PlanReference';
import { RowDataPacket } from 'mysql2';
import { Break } from '../Model/Break';

export interface PlanD extends RowDataPacket {
  Plan_Id: string;
  User_Id: string;
  Title: string;
  Description: string;
  Scheduled_On: Date;
  Start_Time: Date;
  End_Time: Date;
  Day: string;
  Created_On: Date;
  Updated_On: Date;
  Created_By: string;
  Updated_By: string;
  Email: string; // from tbl_User
}

export interface PlanReferenceD extends RowDataPacket {
  Plan_Reference_Id: string;
  Plan_Id: string;
  HyperLink: string;
  Description: string;
  Created_On: Date;
  Updated_On: Date;
  Created_By: string;
  Updated_By: string;
}

export interface PlanBreakD extends RowDataPacket {
  Plan_Id: string;
  Start_Time: Date;
  End_Time: Date;
  Created_On: Date;
  Updated_On: Date;
  Created_By: string;
  Updated_By: string;
}

export interface NoteD extends RowDataPacket {
  Plan_Id: string;
  Note_Id: string;
  Notes: string;
  Edit_Count: number;
  Created_On: Date;
  Updated_On: Date;
  Created_By: string;
  Updated_By: string;
}

export interface PlanReviewD extends RowDataPacket {
  Plan_Id: string;
  Review_Id: string;
  Percentage: number;
  Created_On: Date;
  Created_By: string;
}

@Service()
export default class PlanDatabaseAccessLayer extends DbConnection {
  constructor() {
    super();
  }

  async GetPlanDetails(planId: string) {
    return this.ReadDB<
      [PlanD[], PlanReferenceD[], PlanBreakD[], NoteD[], PlanReviewD[]]
    >(DBsp.GetPlanDetails, [planId]);
  }

  async GetPlansOfSpecifiedDate(date: Date, userId: string) {
    return this.ReadDB<
      [PlanD[], PlanReferenceD[], PlanBreakD[], NoteD[], PlanReviewD[]]
    >(DBsp.GetPlansOfADate, [date, userId]);
  }

  async GetPlanList(userId: string) {
    return this.ReadDB<
      [PlanD[], PlanReferenceD[], PlanBreakD[], NoteD[], PlanReviewD[]]
    >(DBsp.GetPlanList, [userId]);
  }

  async FindMeetingOverlap(startTime: Date, endTime: Date, userId: string) {
    // return this.ReadDB<[PlanD[]]>(DBqueries.FindMeetingOverlap, [
    //   startTime,
    //   endTime,
    //   startTime,
    //   endTime,
    //   startTime,
    //   endTime,
    // ]);
    return this.ReadDB<[PlanD[]]>(DBqueries.FindMeetingOverlapV2, [
      endTime,
      startTime,
      userId,
    ]);
  }

  async FindMeetingOverlapForUpdate(
    planId: string,
    startTime: Date,
    endTime: Date
  ) {
    // return this.ReadDB<[PlanD[]]>(DBqueries.FindMeetingOverlapForUpdate, [
    //   planId,
    //   startTime,
    //   endTime,
    //   startTime,
    //   endTime,
    //   startTime,
    //   endTime,
    // ]);
    return this.ReadDB<[PlanD[]]>(DBqueries.FindMeetingOverlapForUpdateV2, [
      planId,
      startTime,
      endTime,
    ]);
  }

  async CreatePlan(
    planId: string,
    userId: string,
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    day: string,
    createdBy: string,
    planReference: PlanReference[],
    breaks: Break[]
  ) {
    let queryList = [];
    let paramsList = [];
    queryList.push(DBqueries.CreatePlan);
    paramsList.push([
      planId,
      userId,
      title,
      description,
      startTime,
      endTime,
      day.toLowerCase(),
      createdBy,
    ]);
    breaks.forEach(({ startTime, endTime }) => {
      queryList.push(DBqueries.CreatePlanBreak);
      paramsList.push([planId, startTime, endTime, createdBy]);
    });
    planReference.forEach(({ planReferenceId, hyperLink, description }) => {
      queryList.push(DBqueries.CreatePlanReference);
      paramsList.push([
        planReferenceId,
        planId,
        hyperLink,
        description,
        createdBy,
      ]);
    });

    await this.InsertOrUpdateDB(queryList, paramsList);
  }

  async UpdatePlan(
    planId: string,
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    day: string,
    updatedBy: string,
    planReference: PlanReference[],
    breaks: Break[]
  ) {
    let queryList = [];
    let paramsList = [];

    queryList.push(DBqueries.UpdatePlan);
    paramsList.push([
      title,
      description,
      startTime,
      endTime,
      day.toLowerCase(),
      updatedBy,
      planId,
    ]);

    queryList.push(DBqueries.DeleteAllPlanBreaks);
    paramsList.push([planId]);
    breaks.forEach(({ startTime, endTime }) => {
      queryList.push(DBqueries.CreatePlanBreak);
      paramsList.push([planId, startTime, endTime, updatedBy]);
    });

    queryList.push(DBqueries.DeleteAllPlanReferences);
    paramsList.push([planId]);
    planReference.forEach(({ planReferenceId, hyperLink, description }) => {
      queryList.push(DBqueries.CreatePlanReference);
      paramsList.push([
        planReferenceId,
        planId,
        hyperLink,
        description,
        updatedBy,
      ]);
    });

    await this.InsertOrUpdateDB(queryList, paramsList);
  }

  async DeletePlan(planId: string) {
    let queryList = [];
    let paramsList = [];

    queryList.push(DBsp.DeletePlan);
    paramsList.push([planId]);
    await this.InsertOrUpdateDB(queryList, paramsList);
  }

  async InsertPlanReview(
    planId: string,
    reviewId: string,
    percentage: number,
    createdBy: string
  ) {
    let queryList = [];
    let paramsList = [];

    queryList.push(DBqueries.InsertPlanReview);
    paramsList.push([planId, reviewId, percentage, createdBy]);

    await this.InsertOrUpdateDB(queryList, paramsList);
  }

  async UpdatePlanReview(
    planId: string,
    percentage: number,
    updatedBy: string,
    editCount: number
  ) {
    let queryList = [];
    let paramsList = [];

    queryList.push(DBqueries.UpdatePlanReview);
    paramsList.push([percentage, updatedBy, editCount, planId]);

    await this.InsertOrUpdateDB(queryList, paramsList);
  }

  async GetPlanReview(planId: string) {
    return await this.ReadDB<PlanReviewD[]>(DBqueries.GetPlanReview, [planId]);
  }

  async IsPlanEnded(planId: string) {
    return await this.ReadDB<PlanD[]>(DBqueries.IsPlanEnded, [planId]);
  }

  async GetEffectivePlan(userId: string, dayToFetch: string) {
    return await this.ReadDB<PlanD[][]>(DBsp.GetEffectivePlan, [
      userId ?? '',
      dayToFetch.toLowerCase(),
    ]);
  }

  async GetPlanByTitle(
    query: string,
    titles: string[],
    startTime: Date,
    endTime: Date
  ) {
    return await this.ReadDB<PlanD[]>(query, [...titles, startTime, endTime]);
  }

  async getUpcomingPlans(
    reminderMinutes: number,
    window: number = 1
  ): Promise<PlanD[]> {
    const lowerBound = reminderMinutes - window;
    const upperBound = reminderMinutes + window;
    const result = await this.ReadDB<PlanD[]>(DBqueries.GetUpcomingPlans, [
      lowerBound,
      upperBound,
    ]);
    return result;
  }
}

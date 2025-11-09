import { Service } from 'typedi';
import PlanDA, {
  NoteD,
  PlanBreakD,
  PlanD,
  PlanReferenceD,
  PlanReviewD,
} from '../DatabaseAccessLayer/plan.dal';
import { Request, Response } from 'express';
import { GenerateUUID } from '../lib/commonFunctions';
import { GetPlan } from '../Model/GetPlanModel';
import { PlanReference } from '../Model/PlanReference';
import { Break } from '../Model/Break';
import { Note } from '../Model/Note';
import { BreakResponseModel } from '../Model/BreakResponseModel';
import { CreatePlanType } from '../schema/CreatePlan';
import { UpdatePlanType } from '../schema/UpdatePlan';
import { CreatePlanReviewType } from '../schema/CreatePlanReview';
import Levenshtein from 'levenshtein';
import dayjs from 'dayjs';

type FuzzyGroup = {
  fuzzyTitle: string;
  plans: Plan[];
};

type Plan = {
  title: string;
  startTime: Date;
  endTime: Date;
  createdOn: Date;
  day: string;
};

@Service()
export default class PlanService {
  constructor(private readonly planDA: PlanDA) {}

  GetPlanDetails = async (req: Request, res: Response) => {
    const {
      params: { planid },
      userid,
    } = req;

    const [plans, planReferences] = (await this.planDA.GetPlanDetails(
      planid
    )) as any;
    if (Array.isArray(plans) && plans.length > 0)
      plans[0]['PlanReferences'] = planReferences;

    res.status(200).send({
      plans,
    });
  };

  GetPlansOfSpecifiedDate = async (req: Request, res: Response) => {
    const {
      params: { date },
      userid,
    } = req;
    const [plans, planReferences, planBreaks, notes] =
      await this.planDA.GetPlansOfSpecifiedDate(
        new Date(parseInt(date)),
        userid ?? ''
      );
    const plansWithPlanReferences = this.GetPlan(
      plans,
      planReferences,
      planBreaks,
      notes
    );
    res.status(200).send(plansWithPlanReferences);
  };

  GetPlanList = async (req: Request, res: Response) => {
    const { userid } = req;
    const [plans, planReferences, planBreaks, notes, planReviews] =
      await this.planDA.GetPlanList(userid ?? '');
    const plansWithPlanReferences = this.GetPlan(
      plans,
      planReferences,
      planBreaks,
      notes,
      planReviews
    );
    res.status(200).send(plansWithPlanReferences);
  };

  GetPlan = (
    plans: PlanD[],
    planReferences: PlanReferenceD[],
    planBreaks: PlanBreakD[],
    notes: NoteD[],
    planReviews: PlanReviewD[] = []
  ) => {
    if (Array.isArray(plans)) {
      if (Array.isArray(plans)) {
        const plansWithPlanReferences = plans.map<GetPlan>(
          ({
            Plan_Id,
            Title,
            Description,
            Start_Time,
            End_Time,
            Created_On,
            Created_By,
          }) => {
            const planReferencesOfThisPlan =
              planReferences?.filter((pr) => pr.Plan_Id === Plan_Id) ?? [];
            const planBreaksOfThisPlan =
              planBreaks?.filter((pb) => pb.Plan_Id === Plan_Id) ?? [];
            const notesOfThisPlan =
              notes?.filter((note) => note.Plan_Id === Plan_Id) ?? [];
            const planReviewsOfThisPlan =
              planReviews?.filter((pr) => pr.Plan_Id === Plan_Id) ?? [];

            return {
              planId: Plan_Id,
              title: Title,
              description: Description,
              startTime: new Date(Start_Time).getTime(),
              endTime: new Date(End_Time).getTime(),
              createdOn: new Date(Created_On).getTime(),
              createdBy: Created_By,
              planReferences: planReferencesOfThisPlan.map<PlanReference>(
                ({ HyperLink, Description, Plan_Reference_Id }) => {
                  return {
                    hyperLink: HyperLink,
                    description: Description,
                    planReferenceId: Plan_Reference_Id,
                  };
                }
              ),
              breaks: planBreaksOfThisPlan.map<BreakResponseModel>(
                ({ Start_Time, End_Time }) => {
                  return {
                    startTime: new Date(Start_Time).getTime(),
                    endTime: new Date(End_Time).getTime(),
                  };
                }
              ),
              notes: notesOfThisPlan.map<Note>(
                ({ Note_Id, Notes, Created_On }) => {
                  return {
                    note: Notes,
                    noteId: Note_Id,
                    createdOn: Created_On.getTime(),
                  };
                }
              ),
              review:
                planReviewsOfThisPlan.length > 0
                  ? {
                      percentage: planReviewsOfThisPlan[0].Percentage,
                      reviewId: planReviewsOfThisPlan[0].Review_Id,
                      createdOn: planReviewsOfThisPlan[0].Created_On.getTime(),
                      editCount: planReviewsOfThisPlan[0].Edit_Count,
                    }
                  : null,
            };
          }
        );
        return plansWithPlanReferences;
      }
      return [];
    }
  };

  CreatePlan = async (
    request: Request<{}, {}, CreatePlanType>,
    response: Response
  ) => {
    let { title, description } = request.body;

    const { userid } = request;
    const planId = GenerateUUID();

    const {
      planBreaksToBeSaved,
      planEndTime,
      planReferencesToBeSaved,
      planStartTime,
    } = this.PrepareCreateAndUpdateData(request.body);

    const overlappedPlansFound = await this.planDA.FindMeetingOverlap(
      planStartTime,
      planEndTime,
      userid ?? ''
    );

    if (
      Array.isArray(overlappedPlansFound) &&
      overlappedPlansFound.length > 0
    ) {
      response.status(400).send([
        {
          message: 'A plan is already scheduled in the same window',
        },
      ]);
      return;
    }

    await this.planDA.CreatePlan(
      planId,
      userid ?? '',
      title,
      description,
      planStartTime,
      planEndTime,
      planStartTime.toLocaleDateString('en-US', {
        weekday: 'long',
      }),
      userid ?? '',
      planReferencesToBeSaved,
      planBreaksToBeSaved
    );
    const [plans, planReferences, planBreaks, notes] =
      await this.planDA.GetPlanDetails(planId);
    const plansWithPlanReferences = this.GetPlan(
      plans,
      planReferences,
      planBreaks,
      notes
    );
    response.status(200).send(plansWithPlanReferences);
  };

  UpdatePlan = async (
    request: Request<{}, {}, UpdatePlanType>,
    response: Response
  ) => {
    let { title, description, planId } = request.body;

    const { userid } = request;

    const {
      planBreaksToBeSaved,
      planEndTime,
      planReferencesToBeSaved,
      planStartTime,
    } = this.PrepareCreateAndUpdateData(request.body);

    const overlappedPlansFound = await this.planDA.FindMeetingOverlapForUpdate(
      planId,
      planStartTime,
      planEndTime
    );

    if (
      Array.isArray(overlappedPlansFound) &&
      overlappedPlansFound.length > 0
    ) {
      response.status(400).send([
        {
          message: 'A plan is already scheduled in the same window',
        },
      ]);
      return;
    }

    await this.planDA.UpdatePlan(
      planId,
      title,
      description,
      planStartTime,
      planEndTime,
      planStartTime.toLocaleDateString('en-US', {
        weekday: 'long',
      }),
      userid ?? '',
      planReferencesToBeSaved,
      planBreaksToBeSaved
    );
    const [plans, planReferences, planBreaks, notes] =
      await this.planDA.GetPlanDetails(planId);
    const plansWithPlanReferences = this.GetPlan(
      plans,
      planReferences,
      planBreaks,
      notes
    );
    if (plansWithPlanReferences?.length == 0) {
      response.status(400).send([{ message: 'Plan Id not found' }]);
      return;
    }
    response.status(200).send({
      plansWithPlanReferences,
    });
  };

  PrepareCreateAndUpdateData(body: CreatePlanType | UpdatePlanType) {
    let { startTime, endTime, planReferences, breaks } = body;

    let planReferencesToBeSaved: PlanReference[] = [];
    let planBreaksToBeSaved: Break[] = [];

    if (Array.isArray(planReferences)) {
      planReferencesToBeSaved = planReferences.map<PlanReference>((p) => {
        return {
          hyperLink: p?.hyperLink,
          description: p?.description,
          planReferenceId: GenerateUUID(),
        };
      });
    }
    if (Array.isArray(breaks)) {
      planBreaksToBeSaved = breaks.map<Break>(({ startTime, endTime }) => {
        return {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
        };
      });
    }

    return {
      planStartTime: new Date(startTime),
      planEndTime: new Date(endTime),
      planReferencesToBeSaved,
      planBreaksToBeSaved,
    };
  }

  DeletePlan = async (request: Request, response: Response) => {
    const { planid } = request.params;
    await this.planDA.DeletePlan(planid);
    response.status(200).send();
  };

  SavePlanReview = async (
    request: Request<{}, {}, CreatePlanReviewType>,
    response: Response
  ) => {
    const { planId, percentage } = request.body;
    const { userid } = request;

    const plans = await this.planDA.IsPlanEnded(planId);

    if (plans.length > 0) {
      const review = await this.planDA.GetPlanReview(planId);
      if (Array.isArray(review) && review.length > 0) {
        let editCount = review[0].Edit_Count;
        const reviewId = review[0].Review_Id;
        if (editCount === 3) {
          response.status(400).send([
            {
              message: 'Review can be edited only 3 times',
            },
          ]);
          return;
        }
        await this.planDA.UpdatePlanReview(
          planId,
          percentage,
          userid ?? '',
          ++editCount
        );
        response.status(200).send({
          reviewId,
          percentage,
          editCount,
        });
        return;
      }
      const generatedReviewId = GenerateUUID();
      await this.planDA.InsertPlanReview(
        planId,
        generatedReviewId,
        percentage,
        userid ?? ''
      );
      response.status(200).send({
        reviewId: generatedReviewId,
        percentage,
        editCount: 1,
      });
    } else
      response.status(400).send([
        {
          message: 'Plan is not ended',
        },
      ]);
  };

  PredictPlan = async (request: Request, response: Response) => {
    const { userid } = request;
    // Fuzzy threshold: max allowed character differences between titles
    const FUZZY_THRESHOLD = 7;
    const {
      params: { date },
    } = request;
    const formattedDate = new Date(parseInt(date));

    try {
      // Step 2: Fetch plans with Review_Percentage > 67 and matching day
      const [plansFromDB] = await this.planDA.GetEffectivePlan(
        userid,
        formattedDate.toLocaleDateString('en-US', { weekday: 'long' })
      );

      if (plansFromDB.length === 0) {
        console.log('No eligible plans found.');
        response.status(200).send({ message: 'No eligible plans found.' });
        return;
      }

      // Step 3: Move plans into an array with cleaned fields
      const plans = plansFromDB.map((plan) => ({
        title: plan.Title.trim(),
        startTime: plan.Start_Time,
        endTime: plan.End_Time,
        createdOn: plan.Created_On,
        day: plan.Day,
      }));

      console.log('Cleaned Plans:', plans);

      // Step 4: Apply fuzzy matching to group similar titles
      const fuzzyGroups: FuzzyGroup[] = []; // Stores groups of similar plans
      const titleMap: Record<string, FuzzyGroup> = {}; // Maps seen titles to their group

      for (const plan of plans) {
        let matchedGroup: FuzzyGroup | null = null;

        // Compare current plan title to each group's representative title
        for (const groupTitle of Object.keys(titleMap)) {
          const distance = new Levenshtein(
            plan.title.toLowerCase(),
            groupTitle.toLowerCase()
          ).distance;
          // console.log(distance);
          if (distance <= FUZZY_THRESHOLD) {
            matchedGroup = titleMap[groupTitle];
            break;
          }
        }

        if (matchedGroup) {
          matchedGroup.plans.push(plan);
        } else {
          const newGroup: FuzzyGroup = {
            fuzzyTitle: plan.title,
            plans: [plan],
          };
          fuzzyGroups.push(newGroup);
          titleMap[plan.title] = newGroup;
        }
      }

      console.log('Fuzzy Groups:', fuzzyGroups);

      // Step 5: Build unique tag using fuzzyTitle + start + end
      const taggedPlans = fuzzyGroups.flatMap((group) =>
        group.plans.map((plan) => ({
          ...plan,
          fuzzyTitle: group.fuzzyTitle,
          tag: this.generateTag(group.fuzzyTitle, plan.startTime, plan.endTime),
        }))
      );

      console.log('Tagged Plans:', taggedPlans);

      // Step 6: Group by tag and filter those with 4+ occurrences
      const groupedByTag: Record<string, typeof taggedPlans> = {};
      taggedPlans.forEach((plan) => {
        if (!groupedByTag[plan.tag]) groupedByTag[plan.tag] = [];
        groupedByTag[plan.tag].push(plan);
      });

      console.log('Grouped by Tag:', groupedByTag);

      const finalGroups = Object.values(groupedByTag).filter(
        (group) => group.length >= 4
      );

      console.log('Final Groups:', finalGroups);

      // Step 7: From each valid group, fetch 2 most recent plans by exact title
      const finalSuggestions = [];

      for (const group of finalGroups) {
        const placeholders = group.map(() => '?').join(', ');
        const titles = group.map((g) => g.title);
        const { startTime, endTime } = group[0];

        const query = `
        SELECT Title, Start_Time, End_Time
        FROM tbl_Plan
        WHERE Title IN (${placeholders})
          AND TIME(Start_Time) = TIME(?)
          AND TIME(End_Time) = TIME(?)
        ORDER BY Start_Time DESC
        LIMIT 2
      `;

        const matchingPlans = await this.planDA.GetPlanByTitle(
          query,
          titles,
          startTime,
          endTime
        );

        finalSuggestions.push(
          ...matchingPlans.map(({ Title, Start_Time, End_Time }) => {
            return {
              title: Title,
              startTime: this.mergeDateAndTime(
                formattedDate,
                Start_Time
              ).getTime(),
              endTime: this.mergeDateAndTime(formattedDate, End_Time).getTime(),
              startTime1: this.mergeDateAndTime(formattedDate, Start_Time),
              endTime2: this.mergeDateAndTime(formattedDate, End_Time),
            };
          })
        );
      }

      const distinctFinalSuggestions = Array.from(
        new Set(finalSuggestions.map((obj) => JSON.stringify(obj)))
      ).map((str) => JSON.parse(str));

      // Final result
      console.log('Suggested Plans:', distinctFinalSuggestions);
      response.status(200).send(distinctFinalSuggestions);
    } catch (err) {
      console.error('Error suggesting plans:', err);
    }
  };

  generateTag(fuzzyTitle: string, startTime: Date, endTime: Date): string {
    const start = dayjs(startTime).format('HH:mm');
    const end = dayjs(endTime).format('HH:mm');
    return `${start}-${end}`;
  }

  mergeDateAndTime(datePart: Date, timePart: Date): Date {
    const merged = new Date(datePart);

    merged.setHours(timePart.getHours());
    merged.setMinutes(timePart.getMinutes());
    merged.setSeconds(timePart.getSeconds());
    merged.setMilliseconds(timePart.getMilliseconds());

    return merged;
  }
}

import { BreakRequestModel } from './BreakRequestModel';
import { PlanReference } from './PlanReference';
import { Time } from './TimeRequestModel';

export interface UpdatePlanRequestModel {
  planId: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  planReferences?: PlanReference[];
  breaks?: BreakRequestModel[];
}

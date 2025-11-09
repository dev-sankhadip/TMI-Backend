import { Note } from './Note';
import { PlanReference } from './PlanReference';

export interface GetPlan {
  planId: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  planReferences: PlanReference[];
  notes: Note[];
}

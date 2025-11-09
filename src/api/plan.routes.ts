import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
// import { VerifyUser } from "../middleware/verifyUser";
import PlanService from '../service/plan.service';
import { ValidateCreatePlan } from '../schema/CreatePlan';
import { ValidateUpdatePlan } from '../schema/UpdatePlan';
import { Controller } from '../decorator/controller';
import { ValidateCreatePlanReview } from '../schema/CreatePlanReview';

@Controller('/plan')
export default class PlanRouter {
  constructor(private readonly planService: PlanService) {}

  SetRouter(router: Router) {
    router.get('/:planid', authenticate, this.planService.GetPlanDetails);
    router.get(
      '/date/:date',
      authenticate,
      this.planService.GetPlansOfSpecifiedDate
    );
    router.get('/', authenticate, this.planService.GetPlanList);
    router.post(
      '/',
      authenticate,
      ValidateCreatePlan,
      this.planService.CreatePlan
    );
    router.put(
      '/',
      authenticate,
      ValidateUpdatePlan,
      this.planService.UpdatePlan
    );
    router.delete('/:planid', authenticate, this.planService.DeletePlan);
    router.put(
      '/review',
      authenticate,
      ValidateCreatePlanReview,
      this.planService.SavePlanReview
    );
    router.get('/predict/:date', authenticate, this.planService.PredictPlan);
  }
}

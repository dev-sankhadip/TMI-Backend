import 'reflect-metadata';
import { Service, Inject } from 'typedi';
import dotenv from 'dotenv';
dotenv.config();

import { MailService } from '../lib/mailService';
import PlanDatabaseAccessLayer, {
  PlanD,
} from '../DatabaseAccessLayer/plan.dal';

@Service()
export class ReminderScheduler {
  private readonly reminderMinutes: number;
  private intervalId?: NodeJS.Timeout;

  constructor(
    @Inject(() => PlanDatabaseAccessLayer)
    private planDAL: PlanDatabaseAccessLayer,
    @Inject(() => MailService) private mailService: MailService
  ) {
    this.reminderMinutes = Number(process.env.REMINDER_MINUTES) || 345;
  }

  public start() {
    console.log('Reminder Scheduler started.');
    // Call the check function immediately and then every minute.
    this.checkAndSendReminders();
    // Clear existing interval if any (safety)
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = setInterval(
      () => this.checkAndSendReminders(),
      60 * 1000
    );
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('Reminder Scheduler stopped.');
  }

  private async checkAndSendReminders() {
    try {
      // Fetch only upcoming plans (within the specified reminder range)
      const plans: PlanD[] = await this.planDAL.getUpcomingPlans(
        this.reminderMinutes
      );
      if (!plans || plans.length === 0) {
        console.log('No upcoming plans found.');
        return;
      }

      for (const plan of plans) {
        const planStartTime = new Date(plan.Start_Time);
        const subject = `Reminder: ${plan.Title} at ${planStartTime.toLocaleTimeString()}`;
        const html = `
<html>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0;">
    <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 5px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
      <div style="background: #2c3e50; padding: 20px;">
        <h2 style="color: #fff; margin: 0;">Reminder: ${plan.Title}</h2>
      </div>
      <div style="padding: 20px; color: #333;">
        <p style="font-size: 1rem;"><strong>Start Time:</strong> ${planStartTime.toLocaleString()}</p>
        <p style="font-size: 1rem; line-height: 1.5;">${plan.Description}</p>
        <hr style="border: 0; border-top: 1px solid #eee;">
        <p style="font-size: 0.85rem; color: #999;">This is an automated reminder.</p>
      </div>
    </div>
  </body>
</html>`;

        console.log(`Preparing to send reminder for plan ${plan.Plan_Id}`);
        console.log(`User Email: ${plan.Email}`);
        console.log(`Plan start time: ${planStartTime.toLocaleString()}`);

        try {
          await this.mailService.sendMail({
            to: plan.Email,
            subject,
            html,
          });
          console.log(
            `Reminder sent for plan ${plan.Plan_Id} at ${new Date().toLocaleString()}`
          );
        } catch (mailError) {
          console.error(
            `Error sending reminder for plan ${plan.Plan_Id} at ${new Date().toLocaleString()}:`,
            mailError
          );
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }
}

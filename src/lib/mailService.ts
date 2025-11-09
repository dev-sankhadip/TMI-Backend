import { Service } from 'typedi';
import nodemailer from 'nodemailer';
import EnvironmentDatabaseAccessLayer from '../DatabaseAccessLayer/environment.dal';

@Service()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private environmentDAL: EnvironmentDatabaseAccessLayer;

  constructor() {
    // Initialize the DAL instance
    this.environmentDAL = new EnvironmentDatabaseAccessLayer();
  }

  // Initialize transporter with credentials from environment
  private async initTransporter() {
    const emailUserResult =
      await this.environmentDAL.GetEnvironmentValue('EMAIL_USER');
    const emailPassResult =
      await this.environmentDAL.GetEnvironmentValue('EMAIL_PASS');
    const emailUser =
      (emailUserResult && emailUserResult[0] && emailUserResult[0].EnvValue) ||
      '';
    const emailPass =
      (emailPassResult && emailPassResult[0] && emailPassResult[0].EnvValue) ||
      '';

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  // Send email using the transporter
  async sendMail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<any> {
    if (!this.transporter) {
      await this.initTransporter();
    }
    return this.transporter!.sendMail(options);
  }
}

import { Service } from 'typedi';
import DbConnection from './dbConnection';
import { DBqueries } from '../Shared/dBQueries';
import { RowDataPacket } from 'mysql2';

export interface AuthD extends RowDataPacket {
  First_Name: string;
  Last_Name: string;
  Email: string;
  Created_On: Date;
  Updated_On: Date;
  Is_Active: string;
  User_Id: string;
  Password: string; // Optional, as it may not be returned in all queries
}

@Service()
export default class AuthDatabaseAccessLayer extends DbConnection {
  constructor() {
    super();
  }

  async CreateUser(
    userId: string,
    firstName: string,
    lastName: string,
    email: string,
    hashedPassword: string
  ) {
    const result = await this.InsertOrUpdateDB(
      [DBqueries.CreateUser],
      [[userId, firstName, lastName, email, hashedPassword]]
    );
    return result;
  }

  async CheckEmailExists(email: string) {
    const result = await this.ReadDB<AuthD[]>(DBqueries.DoesEmailExist, [
      email,
    ]);
    return result;
  }

  async GetUserById(userId: string) {
    const result = await this.ReadDB<AuthD[]>(DBqueries.GetUserById, [userId]);
    return result;
  }

  async UpdateUser(userId: string, firstName: string, lastName: string) {
    const result = await this.InsertOrUpdateDB(
      [DBqueries.UpdateUser],
      [[firstName, lastName, userId]]
    );
    return result;
  }

  async UpdateUserPassword(email: string, hashedPassword: string) {
    const result = await this.InsertOrUpdateDB(
      [DBqueries.UpdateUserPassword],
      [[hashedPassword, email]]
    );
    return result;
  }

  async GetUserByEmail(email: string) {
    const result = await this.ReadDB<AuthD[]>(DBqueries.GetUserByEmail, [
      email,
    ]);
    return result;
  }

  async DeleteUserByEmail(email: string) {
    // For testing only: delete user by email
    const result = await this.InsertOrUpdateDB(
      ['DELETE FROM tbl_User WHERE Email = ?'],
      [[email]]
    );
    return result;
  }
}

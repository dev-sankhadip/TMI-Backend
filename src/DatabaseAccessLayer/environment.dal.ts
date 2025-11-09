import { Service } from 'typedi';
import DbConnection from './dbConnection';
import { RowDataPacket } from 'mysql2';

export interface EnvironmentD extends RowDataPacket {
  EnvKey: string;
  EnvValue: string;
  Created_On: Date;
  Updated_On: Date;
}

@Service()
export default class EnvironmentDatabaseAccessLayer extends DbConnection {
  constructor() {
    super();
  }

  /**
   * Get the environment value for a given key
   * @param envKey - the key to lookup
   * @returns an array with the matching environment record
   */
  async GetEnvironmentValue(envKey: string) {
    const query =
      'SELECT EnvKey, EnvValue, Created_On, Updated_On FROM tbl_Environment WHERE EnvKey = ?';
    const result = await this.ReadDB<EnvironmentD[]>(query, [envKey]);
    return result;
  }

  /**
   * Get all environment key-value pairs
   * @returns an array of environment records
   */
  async GetAllEnvironmentValues() {
    const query =
      'SELECT EnvKey, EnvValue, Created_On, Updated_On FROM tbl_Environment';
    const result = await this.ReadDB(query);
    return result;
  }

  /**
   * Save or update an environment value
   * Uses INSERT ... ON DUPLICATE KEY UPDATE to upsert the environment variable
   * @param envKey - the key
   * @param envValue - the value
   */
  async SaveEnvironmentValue(envKey: string, envValue: string) {
    const query =
      'INSERT INTO tbl_Environment (EnvKey, EnvValue) VALUES (?, ?) ON DUPLICATE KEY UPDATE EnvValue = ?';
    await this.InsertOrUpdateDB([query], [[envKey, envValue, envValue]]);
  }
}

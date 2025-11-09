import { Service } from 'typedi';
import DbConnection from './dbConnection';
import { DBqueries } from '../Shared/dBQueries';

@Service()
export default class NoteDatabaseAccessLayer extends DbConnection {
  constructor() {
    super();
  }

  async FindById(planId: string) {
    const result = await this.ReadDB(DBqueries.FindById, [planId]);
    return result;
  }

  async FindByNoteId(NoteId: string) {
    const result = await this.ReadDB(DBqueries.FindByNoteId, [NoteId]);
    return result;
  }

  async SaveNotes(
    notesId: string,
    planId: string,
    notes: string,
    userId: string
  ) {
    await this.InsertOrUpdateDB(
      [DBqueries.SaveNotes],
      [[notesId, planId, notes, userId]]
    );
  }

  async UpdateNotes(notesId: string, notes: string, userId: string) {
    await this.InsertOrUpdateDB(
      [DBqueries.UpdateNotes],
      [[notesId, notes, userId]]
    );
  }

  async DeleteNote(noteId: string) {
    await this.InsertOrUpdateDB([DBqueries.DeleteNote], [[noteId]]);
  }
}

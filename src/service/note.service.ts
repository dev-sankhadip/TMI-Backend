import { Service } from 'typedi';
import { Request, Response } from 'express';
import { GenerateUUID } from '../lib/commonFunctions';
import NoteDatabaseAccessLayer from '../DatabaseAccessLayer/note.dal';
import { UpdateNoteRequestModel } from '../Model/UpdateNoteRequestModel';
import { CreateNoteType } from '../schema/CreateNote';

@Service()
export default class NoteService {
  constructor(private readonly noteDA: NoteDatabaseAccessLayer) {}

  CreateNote = async (
    request: Request<{}, {}, CreateNoteType>,
    response: Response
  ) => {
    // throw new Error("Create note error")
    let { notes, planId } = request.body;
    const { userid } = request;

    const planExists = await this.noteDA.FindById(planId);
    if (!planExists || Object.keys(planExists).length === 0) {
      response.status(400).send([{ message: 'PlanId does not exist.' }]);
      return;
    }

    const noteId = GenerateUUID();

    await this.noteDA.SaveNotes(noteId, planId, notes, userid ?? '');
    response.status(200).send({
      noteId,
    });
  };

  UpdateNote = async (
    request: Request<{}, {}, UpdateNoteRequestModel>,
    response: Response
  ) => {
    let { noteId, notes } = request.body;

    const { userid } = request;

    await this.noteDA.UpdateNotes(noteId, notes, userid);
    response.status(200).send({});
  };

  DeleteNote = async (request: Request, response: Response) => {
    let { noteId } = request.params;

    const validNoteId = await this.noteDA.FindByNoteId(noteId);
    if (!validNoteId || Object.keys(validNoteId).length === 0) {
      response.status(400).send([{ message: 'note id does not exist.' }]);
      return;
    }

    await this.noteDA.DeleteNote(noteId);
    response
      .status(200)
      .send([{ message: `Successfully deleted note id ${noteId}` }]);
  };
}

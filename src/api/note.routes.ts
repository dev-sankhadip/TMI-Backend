import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import NoteService from '../service/note.service';
import { ValidateCreateNote } from '../schema/CreateNote';
import { Controller } from '../decorator/controller';

@Controller('/note')
export default class NoteRouter {
  constructor(private readonly noteService: NoteService) {}

  SetRouter(router: Router) {
    router.post(
      '/',
      authenticate,
      ValidateCreateNote,
      this.noteService.CreateNote
    );
    router.delete('/:noteId', authenticate, this.noteService.DeleteNote);
  }
}

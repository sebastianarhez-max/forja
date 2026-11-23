import { Injectable } from '@angular/core';
import { Rutina } from '../models/seguimiento';
import { CrudService } from './crud-service';

@Injectable({ providedIn: 'root' })
export class RutinaService extends CrudService<Rutina> {
  protected readonly recurso = 'rutina';
}

import { Injectable } from '@angular/core';
import { Sala } from '../models/sala';
import { CrudService } from './crud-service';

@Injectable({ providedIn: 'root' })
export class SalaService extends CrudService<Sala> {
  protected readonly recurso = 'sala';
}

import { Injectable } from '@angular/core';
import { Membresia } from '../models/membresia';
import { CrudService } from './crud-service';

@Injectable({ providedIn: 'root' })
export class MembresiaService extends CrudService<Membresia> {
  protected readonly recurso = 'membresia';
}

import { Injectable } from '@angular/core';
import { Torneo } from '../models/torneo';
import { CrudService } from './crud-service';

@Injectable({ providedIn: 'root' })
export class TorneoService extends CrudService<Torneo> {
  protected readonly recurso = 'torneo';
}

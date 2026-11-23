import { Injectable } from '@angular/core';
import { Plan } from '../models/plan';
import { CrudService } from './crud-service';

@Injectable({ providedIn: 'root' })
export class PlanService extends CrudService<Plan> {
  protected readonly recurso = 'plan';
}

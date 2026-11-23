import { Injectable } from '@angular/core';
import { Categoria } from '../models/producto';
import { CrudService } from './crud-service';

@Injectable({ providedIn: 'root' })
export class CategoriaService extends CrudService<Categoria> {
  protected readonly recurso = 'categoria';
}

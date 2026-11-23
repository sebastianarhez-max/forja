import { Injectable } from '@angular/core';
import { Producto } from '../models/producto';
import { CrudService } from './crud-service';

@Injectable({ providedIn: 'root' })
export class ProductoService extends CrudService<Producto> {
  protected readonly recurso = 'producto';
}

export interface Categoria {
  idCategoria?: number;
  nombre: string;
  estado: boolean;
}

export interface Producto {
  idProducto?: number;
  categoria: Partial<Categoria> & { idCategoria: number };
  nombre: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  estado: boolean;
}

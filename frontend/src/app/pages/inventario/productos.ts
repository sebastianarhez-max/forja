import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Categoria, Producto } from '../../models/producto';
import { CategoriaService } from '../../services/categoria-service';
import { ProductoService } from '../../services/producto-service';
import { CampoError } from '../../shared/campo-error';
import { SolesPipe } from '../../shared/pipes';
import { alertaError, alertaExito, confirmar } from '../../shared/util';

/** HU05 · Registrar categorías y productos de la tienda y consultar su stock. */
@Component({
  selector: 'app-productos',
  imports: [ReactiveFormsModule, FormsModule, CampoError, SolesPipe, RouterLink],
  templateUrl: './productos.html',
})
export class Productos implements OnInit {
  private readonly categoriaService = inject(CategoriaService);
  private readonly productoService = inject(ProductoService);
  private readonly fb = inject(FormBuilder);

  readonly categorias = signal<Categoria[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly editandoCategoria = signal<number | null>(null);
  readonly editandoProducto = signal<number | null>(null);
  readonly filtro = signal('');
  readonly filtroCategoria = signal<number | ''>('');

  readonly categoriasActivas = computed(() => this.categorias().filter((c) => c.estado));
  readonly filtrados = computed(() => {
    const f = this.filtro().trim().toLowerCase();
    const cat = this.filtroCategoria();
    return this.productos().filter(
      (p) => (!f || p.nombre.toLowerCase().includes(f)) && (cat === '' || p.categoria.idCategoria === Number(cat)),
    );
  });

  readonly formCategoria = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(45)]],
    estado: [true],
  });

  readonly formProducto = this.fb.group({
    idCategoria: [null as number | null, Validators.required],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    precio: [null as number | null, [Validators.required, Validators.min(0.1)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    stockMinimo: [5, [Validators.required, Validators.min(0)]],
    estado: [true],
  });

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
  }

  cargarCategorias(): void {
    this.categoriaService.lista().subscribe({
      next: (d) => this.categorias.set(d.sort((a, b) => a.nombre.localeCompare(b.nombre))),
      error: (e) => alertaError(e, 'No se pudo cargar las categorías'),
    });
  }

  cargarProductos(): void {
    this.productoService.lista().subscribe({
      next: (d) => this.productos.set(d.sort((a, b) => (a.idProducto ?? 0) - (b.idProducto ?? 0))),
      error: (e) => alertaError(e, 'No se pudo cargar los productos'),
    });
  }

  // ------------------------------------------------------------ categorías
  guardarCategoria(): void {
    if (this.formCategoria.invalid) {
      this.formCategoria.markAllAsTouched();
      return;
    }
    const v = this.formCategoria.getRawValue();
    const obj: Categoria = { nombre: v.nombre.trim(), estado: v.estado };
    const id = this.editandoCategoria();
    (id ? this.categoriaService.actualizar(id, { ...obj, idCategoria: id }) : this.categoriaService.registrar(obj)).subscribe({
      next: (r) => {
        alertaExito(id ? 'Categoría actualizada' : `Categoría ${r.data.nombre} registrada`);
        this.cancelarCategoria();
        this.cargarCategorias();
        this.cargarProductos();
      },
      error: (e) => alertaError(e),
    });
  }

  editarCategoria(c: Categoria): void {
    this.editandoCategoria.set(c.idCategoria ?? null);
    this.formCategoria.setValue({ nombre: c.nombre, estado: c.estado });
  }

  cancelarCategoria(): void {
    this.editandoCategoria.set(null);
    this.formCategoria.reset({ nombre: '', estado: true });
  }

  // ------------------------------------------------------------ productos
  guardarProducto(): void {
    if (this.formProducto.invalid) {
      this.formProducto.markAllAsTouched();
      return;
    }
    const v = this.formProducto.getRawValue();
    const obj: Producto = {
      categoria: { idCategoria: Number(v.idCategoria) },
      nombre: (v.nombre ?? '').trim(),
      precio: Number(v.precio),
      stock: Number(v.stock),
      stockMinimo: Number(v.stockMinimo),
      estado: v.estado ?? true,
    };
    const id = this.editandoProducto();
    (id ? this.productoService.actualizar(id, { ...obj, idProducto: id }) : this.productoService.registrar(obj)).subscribe({
      next: (r) => {
        alertaExito(id ? 'Producto actualizado' : `Producto ${r.data.nombre} registrado`);
        this.cancelarProducto();
        this.cargarProductos();
      },
      error: (e) => alertaError(e),
    });
  }

  editarProducto(p: Producto): void {
    this.editandoProducto.set(p.idProducto ?? null);
    this.formProducto.setValue({
      idCategoria: p.categoria.idCategoria,
      nombre: p.nombre,
      precio: p.precio,
      stock: p.stock,
      stockMinimo: p.stockMinimo,
      estado: p.estado,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarProducto(): void {
    this.editandoProducto.set(null);
    this.formProducto.reset({ idCategoria: null, nombre: '', precio: null, stock: 0, stockMinimo: 5, estado: true });
  }

  async cambiarEstado(p: Producto): Promise<void> {
    if (p.estado) {
      if (!(await confirmar('Desactivar producto', `¿Desactivar "${p.nombre}"? Ya no se podrá vender.`, 'Sí, desactivar'))) return;
      this.productoService.eliminar(p.idProducto!).subscribe({
        next: () => { alertaExito('Producto desactivado'); this.cargarProductos(); },
        error: (e) => alertaError(e),
      });
    } else {
      this.productoService.actualizar(p.idProducto!, { ...p, estado: true }).subscribe({
        next: () => { alertaExito('Producto activado'); this.cargarProductos(); },
        error: (e) => alertaError(e),
      });
    }
  }
}

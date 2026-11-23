import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/** Muestra debajo de un campo el primer error de validación, cuando el usuario ya lo tocó. */
@Component({
  selector: 'app-campo-error',
  template: `
    @if (mensaje(); as m) {
      <small class="campo-error">{{ m }}</small>
    }
  `,
})
export class CampoError {
  readonly control = input.required<AbstractControl>();
  /** Mensaje para errores de formato (pattern), p. ej. "Debe tener 8 dígitos". */
  readonly formato = input('Formato no válido');

  mensaje(): string | null {
    const c = this.control();
    if (!c.errors || !(c.touched || c.dirty)) return null;
    const e = c.errors;
    if (e['required']) return 'Este campo es obligatorio';
    if (e['minlength']) return `Mínimo ${e['minlength'].requiredLength} caracteres`;
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres`;
    if (e['min']) return `El valor mínimo es ${e['min'].min}`;
    if (e['max']) return `El valor máximo es ${e['max'].max}`;
    if (e['email']) return 'Correo no válido';
    if (e['pattern']) return this.formato();
    if (e['horas']) return 'La hora de fin debe ser mayor que la de inicio';
    return 'Valor no válido';
  }
}

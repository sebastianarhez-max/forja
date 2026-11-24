import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Cliente } from '../../models/cliente';
import { Cupos } from '../../models/consultas';
import { Horario } from '../../models/horario';
import { Membresia } from '../../models/membresia';
import { ClienteService } from '../../services/cliente-service';
import { ConsultaService } from '../../services/consulta-service';
import { HorarioService } from '../../services/horario-service';
import { MembresiaService } from '../../services/membresia-service';
import { RegistroService } from '../../services/registro-service';
import { TokenService } from '../../security/token.service';
import { FechaPipe } from '../../shared/pipes';
import {
  alertaAviso,
  alertaError,
  alertaExito,
  diaConTilde,
  fechaSugerida,
  nombreDia,
  ordenarClases,
  textoClase,
} from '../../shared/util';

/** HU02 · Consultar cupos de una clase y reservar el cupo de un cliente. */
@Component({
  selector: 'app-reservas',
  imports: [FormsModule, FechaPipe],
  templateUrl: './reservas.html',
})
export class Reservas implements OnInit {
  private readonly horarioService = inject(HorarioService);
  private readonly clienteService = inject(ClienteService);
  private readonly membresiaService = inject(MembresiaService);
  private readonly consultaService = inject(ConsultaService);
  private readonly registroService = inject(RegistroService);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  /** Query params opcionales (?idHorario=1&fecha=2026-10-05) */
  readonly idHorarioParam = input<string | undefined>(undefined, { alias: 'idHorario' });
  readonly fechaParam = input<string | undefined>(undefined, { alias: 'fecha' });

  readonly usuario = this.tokenService.getUserName();
  readonly texto = textoClase;
  readonly clases = signal<Horario[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly membresias = signal<Membresia[]>([]);
  readonly idHorario = signal<number | null>(null);
  readonly fecha = signal('');
  readonly idCliente = signal<number | null>(null);
  readonly cupos = signal<Cupos | null>(null);
  readonly reservando = signal(false);

  readonly clase = computed(() => this.clases().find((h) => h.idHorario === this.idHorario()) ?? null);

  /** Avisa antes de enviar si la fecha no coincide con el día de la clase. */
  readonly fechaIncorrecta = computed(() => {
    const h = this.clase();
    const f = this.fecha();
    if (!h || !f) return '';
    if (h.fecha) return h.fecha !== f ? `Esta clase solo se dicta el ${h.fecha.split('-').reverse().join('/')}` : '';
    return nombreDia(f) !== h.dia ? `Esta clase es de los días ${diaConTilde(h.dia)} y la fecha elegida es ${diaConTilde(nombreDia(f))}` : '';
  });

  /** Membresía del cliente que cubre la fecha elegida (solo importa en clases MEMBRESIA). */
  readonly membresiaVigente = computed(() => {
    const id = this.idCliente();
    const f = this.fecha();
    if (!id || !f) return null;
    return (
      this.membresias()
        .filter((m) => m.estado && m.cliente.idCliente === id && m.fechaInicio <= f && f <= m.fechaFin)
        .sort((a, b) => b.fechaFin.localeCompare(a.fechaFin))[0] ?? null
    );
  });

  ngOnInit(): void {
    forkJoin({
      clases: this.horarioService.lista(),
      clientes: this.clienteService.lista(),
      membresias: this.membresiaService.lista(),
    }).subscribe({
      next: ({ clases, clientes, membresias }) => {
        this.clases.set(ordenarClases(clases.filter((h) => h.estado)));
        this.clientes.set(clientes.filter((c) => c.estado).sort((a, b) => a.nombres.localeCompare(b.nombres)));
        this.membresias.set(membresias);
        const id = Number(this.idHorarioParam());
        if (id && this.clases().some((h) => h.idHorario === id)) {
          this.elegirClase(id, this.fechaParam());
        }
      },
      error: (e) => alertaError(e, 'No se pudo cargar los datos'),
    });
  }

  elegirClase(id: number | null, fecha?: string): void {
    this.idHorario.set(id);
    this.cupos.set(null);
    const h = this.clase();
    if (h) {
      this.fecha.set(fecha || fechaSugerida(h));
      this.consultarCupos();
    }
  }

  cambiarFecha(f: string): void {
    this.fecha.set(f);
    this.cupos.set(null);
    if (this.clase() && f) this.consultarCupos();
  }

  consultarCupos(): void {
    const id = this.idHorario();
    if (!id || !this.fecha()) {
      alertaAviso('Selecciona una clase y una fecha');
      return;
    }
    this.consultaService.cupos(id, this.fecha()).subscribe({
      next: (r) => this.cupos.set(r[0] ?? null),
      error: (e) => alertaError(e),
    });
  }

  reservar(): void {
    const id = this.idHorario();
    const cliente = this.idCliente();
    if (!id || !cliente || !this.fecha()) {
      alertaAviso('Selecciona la clase, la fecha y el socio');
      return;
    }
    this.reservando.set(true);
    this.registroService
      .reservar({ idHorario: id, idCliente: cliente, idUsuario: this.tokenService.getUserId(), fecha: this.fecha() })
      .subscribe({
        next: (a) => {
          this.reservando.set(false);
          alertaExito(`Cupo reservado para ${a.cliente.nombres} ${a.cliente.apellidos}`);
          this.idCliente.set(null);
          this.consultarCupos();
        },
        error: (e) => {
          this.reservando.set(false);
          alertaError(e, 'No se pudo reservar');
        },
      });
  }

  verAsistentes(): void {
    this.router.navigate(['/asistencia/asistentes'], { queryParams: { idHorario: this.idHorario(), fecha: this.fecha() } });
  }
}

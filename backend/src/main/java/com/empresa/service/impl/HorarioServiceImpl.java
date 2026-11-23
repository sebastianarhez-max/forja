package com.empresa.service.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.empresa.entity.Actividad;
import com.empresa.entity.Entrenador;
import com.empresa.entity.Horario;
import com.empresa.entity.Sala;
import com.empresa.entity.TipoAcceso;
import com.empresa.repository.ActividadRepository;
import com.empresa.repository.EntrenadorRepository;
import com.empresa.repository.HorarioRepository;
import com.empresa.repository.SalaRepository;
import com.empresa.service.HorarioService;
import com.empresa.util.Fechas;

@Service
public class HorarioServiceImpl implements HorarioService {

    @Autowired
    private HorarioRepository repository;

    @Autowired
    private ActividadRepository actividadRepository;

    @Autowired
    private EntrenadorRepository entrenadorRepository;

    @Autowired
    private SalaRepository salaRepository;

    private static ResponseStatusException err(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    /** Devuelve "07:00 a 08:00" para los mensajes. */
    private static String rango(Horario h) {
        return h.getHoraInicio() + " a " + h.getHoraFin();
    }

    /** Dos clases se cruzan si caen el mismo día (y la misma fecha, si ambas la tienen) y sus horas se superponen. */
    private static boolean seCruzan(Horario a, Horario b) {
        if (!Fechas.sinTildes(a.getDia()).equalsIgnoreCase(Fechas.sinTildes(b.getDia()))) {
            return false;
        }
        if (a.getFecha() != null && b.getFecha() != null && !a.getFecha().equals(b.getFecha())) {
            return false;
        }
        return a.getHoraInicio().isBefore(b.getHoraFin()) && a.getHoraFin().isAfter(b.getHoraInicio());
    }

    /** Reglas de negocio para registrar o actualizar una clase (HU01 + salas). */
    private void validar(Horario obj) {
        // 1. Actividad y entrenador: obligatorios, existentes y activos
        if (obj.getActividad() == null || obj.getActividad().getIdActividad() == null) {
            throw err("Falta el campo obligatorio: actividad");
        }
        if (obj.getEntrenador() == null || obj.getEntrenador().getIdEntrenador() == null) {
            throw err("Falta el campo obligatorio: entrenador");
        }
        Actividad act = actividadRepository.findById(obj.getActividad().getIdActividad())
                .orElseThrow(() -> err("La actividad no existe"));
        Entrenador ent = entrenadorRepository.findById(obj.getEntrenador().getIdEntrenador())
                .orElseThrow(() -> err("El entrenador no existe"));
        if (!Boolean.TRUE.equals(act.getEstado())) throw err("La actividad " + act.getNombre() + " está inactiva");
        if (!Boolean.TRUE.equals(ent.getEstado())) throw err("El entrenador " + ent.getNombres() + " está inactivo");
        obj.setActividad(act);
        obj.setEntrenador(ent);

        // 2. Horas
        if (obj.getHoraInicio() == null) throw err("Falta el campo obligatorio: horaInicio");
        if (obj.getHoraFin() == null) throw err("Falta el campo obligatorio: horaFin");
        if (!obj.getHoraFin().isAfter(obj.getHoraInicio())) {
            throw err("La hora de fin debe ser mayor que la hora de inicio");
        }

        // 3. Día: si la clase es de una fecha específica, el día se toma de esa fecha
        if (obj.getFecha() != null) {
            obj.setDia(Fechas.nombreDia(obj.getFecha()));
        } else if (obj.getDia() == null || !Fechas.esDiaValido(obj.getDia())) {
            throw err("Indica un día válido (Lunes a Domingo) o una fecha específica");
        } else {
            String d = Fechas.sinTildes(obj.getDia()).toLowerCase();
            obj.setDia(Character.toUpperCase(d.charAt(0)) + d.substring(1));
        }

        // 4. Tipo de acceso y precio (valores por defecto: MEMBRESIA y 0)
        if (obj.getTipoAcceso() == null) obj.setTipoAcceso(TipoAcceso.MEMBRESIA);
        if (obj.getPrecioEntrada() == null) obj.setPrecioEntrada(BigDecimal.ZERO);
        if (obj.getTipoAcceso() == TipoAcceso.MEMBRESIA) {
            obj.setPrecioEntrada(BigDecimal.ZERO); // incluida en la membresía: no se cobra
        } else if (obj.getPrecioEntrada().compareTo(BigDecimal.ZERO) <= 0) {
            throw err("Una clase LIBRE debe tener un precio de entrada mayor a 0");
        }
        if (obj.getEstado() == null) obj.setEstado(true);

        // 5. Sala: debe existir y estar activa; el cupo no puede superar su capacidad
        if (obj.getSala() != null && obj.getSala().getIdSala() != null) {
            Sala sala = salaRepository.findById(obj.getSala().getIdSala())
                    .orElseThrow(() -> err("La sala no existe"));
            if (!Boolean.TRUE.equals(sala.getEstado())) throw err("La " + sala.getNombre() + " está inactiva");
            if (obj.getCupoMaximo() == null) obj.setCupoMaximo(sala.getCapacidad());
            if (obj.getCupoMaximo() > sala.getCapacidad()) {
                throw err("El cupo (" + obj.getCupoMaximo() + ") supera la capacidad de la "
                        + sala.getNombre() + " (" + sala.getCapacidad() + " personas)");
            }
            obj.setSala(sala);
        } else {
            obj.setSala(null);
        }
        if (obj.getCupoMaximo() != null && obj.getCupoMaximo() <= 0) {
            throw err("El cupo máximo debe ser mayor a 0");
        }

        // 6. Cruce de horario en la misma sala (solo para clases activas)
        if (!Boolean.TRUE.equals(obj.getEstado())) {
            return;
        }
        if (obj.getSala() != null) {
            for (Horario otro : repository.findBySala_IdSalaAndEstadoTrue(obj.getSala().getIdSala())) {
                if (!otro.getIdHorario().equals(obj.getIdHorario()) && seCruzan(obj, otro)) {
                    throw err("La " + obj.getSala().getNombre() + " ya está ocupada el " + otro.getDia() + " de "
                            + rango(otro) + " por la clase " + otro.getActividad().getNombre());
                }
            }
        }
    }

    @Override
    public List<Horario> listaTodos() {
        return repository.findAll();
    }

    @Override
    public Optional<Horario> buscaPorId(Integer id) {
        return repository.findById(id);
    }

    @Override
    @Transactional
    public Horario inserta(Horario obj) {
        obj.setIdHorario(null);
        validar(obj);
        return repository.save(obj);
    }

    @Override
    @Transactional
    public Horario actualiza(Horario obj) {
        validar(obj);
        return repository.save(obj);
    }

    @Override
    public void elimina(Integer id) {
        repository.findById(id).ifPresent(e -> {
            e.setEstado(false);
            repository.save(e);
        });
    }
}

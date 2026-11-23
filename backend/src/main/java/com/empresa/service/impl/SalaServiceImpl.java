package com.empresa.service.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.empresa.entity.Horario;
import com.empresa.entity.Sala;
import com.empresa.repository.HorarioRepository;
import com.empresa.repository.SalaRepository;
import com.empresa.service.SalaService;

@Service
public class SalaServiceImpl implements SalaService {

    @Autowired
    private SalaRepository repository;

    @Autowired
    private HorarioRepository horarioRepository;

    private static ResponseStatusException err(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    /** Reglas comunes de alta y actualización. */
    private void validar(Sala obj) {
        if (obj.getNombre() == null || obj.getNombre().isBlank()) {
            throw err("Falta el campo obligatorio: nombre");
        }
        if (obj.getCapacidad() == null || obj.getCapacidad() <= 0) {
            throw err("La capacidad de la sala debe ser mayor a 0");
        }
        obj.setNombre(obj.getNombre().trim());
        repository.findFirstByNombreIgnoreCase(obj.getNombre()).ifPresent(otra -> {
            if (!otra.getIdSala().equals(obj.getIdSala())) {
                throw err("Ya existe una sala con el nombre " + obj.getNombre());
            }
        });
        if (obj.getEstado() == null) {
            obj.setEstado(true);
        }
    }

    @Override
    public List<Sala> listaTodos() {
        return repository.findAll();
    }

    @Override
    public Optional<Sala> buscaPorId(Integer id) {
        return repository.findById(id);
    }

    @Override
    public Sala inserta(Sala obj) {
        obj.setIdSala(null);
        validar(obj);
        return repository.save(obj);
    }

    @Override
    public Sala actualiza(Sala obj) {
        validar(obj);
        // Si se reduce la capacidad, ninguna clase activa de la sala puede quedar con más cupo que el aforo
        for (Horario h : horarioRepository.findBySala_IdSalaAndEstadoTrue(obj.getIdSala())) {
            if (h.getCupoMaximo() != null && h.getCupoMaximo() > obj.getCapacidad()) {
                throw err("No se puede reducir la capacidad a " + obj.getCapacidad()
                        + ": la clase " + h.getActividad().getNombre() + " (" + h.getDia() + " "
                        + h.getHoraInicio() + ") tiene cupo " + h.getCupoMaximo());
            }
        }
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

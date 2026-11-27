package com.empresa.service.impl;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.empresa.entity.Opcion;
import com.empresa.entity.Rol;
import com.empresa.repository.OpcionRepository;
import com.empresa.repository.RolRepository;
import com.empresa.service.RolService;

@Service
public class RolServiceImpl implements RolService {

    @Autowired
    private RolRepository repository;

    @Autowired
    private OpcionRepository opcionRepository;

    private static ResponseStatusException err(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    /** Reglas comunes de alta y actualización. */
    private void validar(Rol obj) {
        if (obj.getNombre() == null || obj.getNombre().isBlank()) {
            throw err("Falta el campo obligatorio: nombre");
        }
        obj.setNombre(obj.getNombre().trim());
        if (obj.getNombre().length() > 45) {
            throw err("El nombre del rol admite como máximo 45 caracteres");
        }
        repository.findFirstByNombreIgnoreCase(obj.getNombre()).ifPresent(otro -> {
            if (!otro.getIdRol().equals(obj.getIdRol())) {
                throw err("Ya existe un rol con el nombre " + obj.getNombre());
            }
        });
        if (obj.getOpciones() == null || obj.getOpciones().isEmpty()) {
            throw err("Selecciona al menos una opción del menú para el rol");
        }
        // Se cargan las opciones desde la base de datos: el JSON solo trae sus ids
        Set<Opcion> opciones = new LinkedHashSet<>();
        for (Opcion o : obj.getOpciones()) {
            if (o == null || o.getIdOpcion() == null) {
                throw err("Cada opción debe indicar su idOpcion");
            }
            opciones.add(opcionRepository.findById(o.getIdOpcion())
                    .orElseThrow(() -> err("La opción " + o.getIdOpcion() + " no existe")));
        }
        obj.setOpciones(opciones);
        if (obj.getEstado() == null) {
            obj.setEstado(true);
        }
    }

    @Override
    public List<Rol> listaTodos() {
        return repository.findAllByOrderByIdRolAsc();
    }

    @Override
    public Optional<Rol> buscaPorId(Integer id) {
        return repository.findById(id);
    }

    @Override
    @Transactional
    public Rol inserta(Rol obj) {
        obj.setIdRol(null);
        validar(obj);
        return repository.save(obj);
    }

    @Override
    @Transactional
    public Rol actualiza(Rol obj) {
        if (Integer.valueOf(Rol.ADMINISTRADOR).equals(obj.getIdRol())) {
            throw err("El rol Administrador no se puede modificar: siempre tiene todas las opciones");
        }
        validar(obj);
        return repository.save(obj);
    }

    @Override
    @Transactional
    public void elimina(Integer id) {
        if (Integer.valueOf(Rol.ADMINISTRADOR).equals(id)) {
            throw err("El rol Administrador no se puede desactivar");
        }
        repository.findById(id).ifPresent(e -> {
            e.setEstado(false);
            repository.save(e);
        });
    }

    @Override
    public List<Opcion> listaOpciones() {
        return opcionRepository.findAllByOrderByTipoAscOrdenAsc();
    }
}

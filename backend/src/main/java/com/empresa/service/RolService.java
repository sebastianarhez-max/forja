package com.empresa.service;

import java.util.List;
import java.util.Optional;

import com.empresa.entity.Opcion;
import com.empresa.entity.Rol;

public interface RolService {

    List<Rol> listaTodos();

    Optional<Rol> buscaPorId(Integer id);

    /** Rol + sus opciones (tablas rol y rol_has_opcion) en una sola transacción. */
    Rol inserta(Rol obj);

    Rol actualiza(Rol obj);

    void elimina(Integer id);

    /** Todas las opciones del menú, para marcar cuáles tendrá cada rol. */
    List<Opcion> listaOpciones();
}

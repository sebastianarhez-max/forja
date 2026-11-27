package com.empresa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.empresa.entity.Opcion;

@Repository
public interface OpcionRepository extends JpaRepository<Opcion, Integer> {

    /** Opciones del menú en el orden en que se muestran (grupo y posición). */
    List<Opcion> findAllByOrderByTipoAscOrdenAsc();
}

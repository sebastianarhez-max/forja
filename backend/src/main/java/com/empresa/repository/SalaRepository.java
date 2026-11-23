package com.empresa.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.empresa.entity.Sala;

@Repository
public interface SalaRepository extends JpaRepository<Sala, Integer> {

    /** Busca otra sala con el mismo nombre (sin distinguir mayúsculas) para evitar duplicados. */
    Optional<Sala> findFirstByNombreIgnoreCase(String nombre);
}

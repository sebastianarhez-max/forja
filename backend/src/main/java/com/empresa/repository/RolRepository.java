package com.empresa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.empresa.entity.Rol;

@Repository
public interface RolRepository extends JpaRepository<Rol, Integer> {

    List<Rol> findAllByOrderByIdRolAsc();

    /** Busca otro rol con el mismo nombre (sin distinguir mayúsculas) para evitar duplicados. */
    Optional<Rol> findFirstByNombreIgnoreCase(String nombre);
}

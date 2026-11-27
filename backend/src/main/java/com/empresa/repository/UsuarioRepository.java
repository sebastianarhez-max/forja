package com.empresa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.empresa.entity.Opcion;
import com.empresa.entity.Rol;
import com.empresa.entity.Usuario;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByLogin(String login);

    /** Roles activos del usuario (tabla usuario_has_rol). */
    @Query("SELECT r FROM Usuario u JOIN u.roles r WHERE u.idUsuario = :idUsuario AND r.estado = true ORDER BY r.idRol")
    List<Rol> traerRolesDeUsuario(@Param("idUsuario") Integer idUsuario);

    /**
     * Opciones del menú que el usuario puede ver: las de todos sus roles activos (rol_has_opcion),
     * sin repetir y en el orden del menú.
     */
    @Query("SELECT DISTINCT o FROM Usuario u JOIN u.roles r JOIN r.opciones o "
            + "WHERE u.idUsuario = :idUsuario AND r.estado = true AND o.estado = true "
            + "ORDER BY o.tipo, o.orden")
    List<Opcion> traerEnlacesDeUsuario(@Param("idUsuario") Integer idUsuario);
}

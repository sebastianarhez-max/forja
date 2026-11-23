package com.empresa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.empresa.entity.Horario;

import jakarta.persistence.LockModeType;

@Repository
public interface HorarioRepository extends JpaRepository<Horario, Integer> {

    /** Clases activas que se dictan en una sala (para validar cruces de horario y aforo). */
    List<Horario> findBySala_IdSalaAndEstadoTrue(Integer idSala);

    /**
     * Lee el horario bloqueando su fila (SELECT ... FOR UPDATE) hasta que termine la transacción.
     * Así dos recepcionistas no pueden ocupar el último cupo de la clase al mismo tiempo.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM Horario h WHERE h.idHorario = :id")
    Optional<Horario> findByIdParaActualizar(@Param("id") Integer id);
}

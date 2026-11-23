package com.empresa.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.empresa.entity.Producto;

import jakarta.persistence.LockModeType;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer> {

    /**
     * Lee el producto bloqueando su fila (SELECT ... FOR UPDATE) hasta que termine la venta.
     * Evita que dos ventas simultáneas descuenten el mismo stock y lo dejen negativo.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Producto p WHERE p.idProducto = :id")
    Optional<Producto> findByIdParaActualizar(@Param("id") Integer id);
}

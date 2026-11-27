package com.empresa.dto;

import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class VentaRegistroDTO {

    private Integer idUsuario;
    private Integer idCliente;
    private List<ItemVentaDTO> items;

    /**
     * Solo para pruebas (como el ejemplo de @Transactional del profesor): si es true, el servicio
     * guarda todo y al final lanza un error, para comprobar que la transacción se deshace (rollback).
     */
    private boolean simularError;
}

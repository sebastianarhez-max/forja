package com.empresa.dto;

import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MembresiaRegistroDTO {

    private Integer idCliente;
    private Integer idPlan;
    private LocalDate fechaInicio;
    private Integer idTipoPago;

    /**
     * Solo para pruebas (como el ejemplo de @Transactional del profesor): si es true, el servicio
     * guarda todo y al final lanza un error, para comprobar que la transacción se deshace (rollback).
     */
    private boolean simularError;
}

package com.empresa.util;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

/** Utilidades de fecha en la zona horaria del gimnasio (Lima), aunque el servidor esté en UTC. */
public final class Fechas {

    public static final ZoneId ZONA = ZoneId.of("America/Lima");

    private Fechas() {
    }

    public static LocalDate hoy() {
        return LocalDate.now(ZONA);
    }

    public static LocalDateTime ahora() {
        return LocalDateTime.now(ZONA);
    }

    /** "Miércoles" -> "Miercoles" (para comparar días sin importar tildes). */
    public static String sinTildes(String s) {
        if (s == null) {
            return "";
        }
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").trim();
    }

    /** Nombre del día en español, tal como se guarda en horario.dia. */
    public static String nombreDia(LocalDate f) {
        switch (f.getDayOfWeek()) {
            case MONDAY: return "Lunes";
            case TUESDAY: return "Martes";
            case WEDNESDAY: return "Miercoles";
            case THURSDAY: return "Jueves";
            case FRIDAY: return "Viernes";
            case SATURDAY: return "Sabado";
            default: return "Domingo";
        }
    }

    /** true si el texto es un día válido de la semana (con o sin tilde). */
    public static boolean esDiaValido(String dia) {
        String d = sinTildes(dia);
        for (String x : new String[] { "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo" }) {
            if (x.equalsIgnoreCase(d)) {
                return true;
            }
        }
        return false;
    }
}

package com.empresa.security;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final JwtEntryPoint jwtEntryPoint;
    private final JwtProvider jwtProvider;

    public SecurityConfig(UserDetailsService userDetailsService, JwtEntryPoint jwtEntryPoint, JwtProvider jwtProvider) {
        this.userDetailsService = userDetailsService;
        this.jwtEntryPoint = jwtEntryPoint;
        this.jwtProvider = jwtProvider;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration authConfiguration) throws Exception {
        return authConfiguration.getAuthenticationManager();
    }

    /** CORS para el frontend Angular (localhost:4200 o el dominio donde se despliegue). */
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * Authority que representa una opción del menú (ver UsuarioPrincipal).
     * Cada grupo de endpoints se protege con la opción del menú a la que pertenece:
     * así, lo que cada rol puede hacer se define en la tabla rol_has_opcion y no en el código.
     */
    private static String opc(String ruta) {
        return UsuarioPrincipal.PREFIJO_OPCION + ruta;
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(exp -> exp
                .authenticationEntryPoint(jwtEntryPoint)
                // Sesión válida pero el rol no tiene la opción: 403 con un mensaje claro
                .accessDeniedHandler((req, res, e) -> {
                    res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    res.setContentType("application/json;charset=UTF-8");
                    res.getWriter().write("{\"error\":\"Tu rol no tiene permiso para esta opción\"}");
                }))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/url/auth/**", "/error").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // ---- Catálogos que varias pantallas necesitan para llenar sus combos (solo lectura)
                .requestMatchers(HttpMethod.GET,
                        "/url/cliente/**", "/url/clientes/**", "/url/horario/**", "/url/horarios/**",
                        "/url/actividad/**", "/url/actividades/**", "/url/entrenador/**", "/url/entrenadores/**",
                        "/url/sala/**", "/url/salas/**", "/url/plan/**", "/url/planes/**",
                        "/url/producto/**", "/url/productos/**", "/url/categoria/**", "/url/categoriaProducto/**",
                        "/url/tipopago/**", "/url/tipoPago/**", "/url/tipos-pago/**",
                        "/url/membresia/**", "/url/torneo/**").authenticated()

                // ---- Reservas, ingresos y faltas (HU02) y cobro de clases libres (HU03)
                .requestMatchers("/url/consulta/cupos")
                    .hasAnyAuthority(opc("asistencia"), opc("clases-libres"), opc("inicio"))
                .requestMatchers("/url/registro/asistencia/**", "/url/asistencia/**", "/url/consulta/asistencia")
                    .hasAnyAuthority(opc("asistencia"), opc("clases-libres"))
                .requestMatchers("/url/consulta/recaudado-clase/**").hasAuthority(opc("clases-libres"))

                // ---- Tienda (HU05)
                .requestMatchers("/url/registro/venta", "/url/venta/**", "/url/detalleventa/**",
                        "/url/producto/**", "/url/productos/**", "/url/categoria/**", "/url/categoriaProducto/**",
                        "/url/consulta/ventas").hasAuthority(opc("tienda"))
                .requestMatchers("/url/consulta/productos-stock-bajo").hasAnyAuthority(opc("tienda"), opc("reportes"))

                // ---- Membresías (HU04)
                .requestMatchers("/url/registro/membresia", "/url/membresia/**", "/url/pago/**",
                        "/url/plan/**", "/url/planes/**",
                        "/url/consulta/membresias-vigentes", "/url/consulta/membresias-por-vencer")
                    .hasAuthority(opc("membresias"))

                // ---- Socios: datos, evaluaciones y rutinas
                .requestMatchers("/url/cliente/**", "/url/clientes/**", "/url/clientehorario/**",
                        "/url/evaluacion/**", "/url/rutina/**", "/url/consulta/cliente/**")
                    .hasAuthority(opc("socios"))

                // ---- Clases y horarios (HU01)
                .requestMatchers("/url/horario/**", "/url/horarios/**", "/url/actividad/**", "/url/actividades/**",
                        "/url/entrenador/**", "/url/entrenadores/**", "/url/consulta/entrenador/**")
                    .hasAuthority(opc("clases"))

                // ---- Salas
                .requestMatchers("/url/sala/**", "/url/salas/**", "/url/consulta/sala/**", "/url/consulta/salas-resumen")
                    .hasAuthority(opc("salas"))

                // ---- Torneos
                .requestMatchers("/url/torneo/**", "/url/inscripciontorneo/**", "/url/consulta/torneo/**")
                    .hasAuthority(opc("torneos"))

                // ---- Reportes
                .requestMatchers("/url/reporte/**", "/url/consulta/ingresos").hasAuthority(opc("reportes"))

                // ---- Configuración: usuarios, métodos de pago, roles y opciones
                .requestMatchers(HttpMethod.GET, "/url/rol/**", "/url/opcion/**")
                    .hasAnyAuthority(opc("configuracion"), opc("roles"))
                .requestMatchers("/url/usuario/**", "/url/tipopago/**", "/url/tipoPago/**", "/url/tipos-pago/**")
                    .hasAuthority(opc("configuracion"))
                .requestMatchers("/url/rol/**", "/url/opcion/**").hasAuthority(opc("roles"))

                .anyRequest().authenticated());
        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(new JwtTokenFilter(jwtProvider, userDetailsService), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}

# Éter

Juego móvil de salas competitivas basado en Éter.

## Identidad del jugador

- Entrada prevista con **cuenta Google**: el jugador elige una cuenta y continúa sin escribir mail ni contraseña.
- La cuenta Google es la identidad privada del jugador.
- El **mail nunca se muestra** a otros jugadores.
- La foto de Google se usa automáticamente como avatar.
- La primera vez se solicita solamente un **nombre de jugador**, que sí es público.
- Los demás jugadores ven nombre, avatar, rango, nivel, Éter y marco de evolución.

## Progresión

- Salas de máximo **20 jugadores**.
- Cada día: **100 Éter disponible**.
- Nivel 1–100.
- 20 marcos visuales; cada 5 niveles cambia el marco.
- Nivel 100 = **ÉTER ABSOLUTO · INMORTAL**.
- Rangos públicos ligados al progreso.
- El avatar no cambia: evoluciona mediante el marco que lo rodea.

## Competencia

- La ruleta selecciona dos jugadores de la sala.
- Después se selecciona un minijuego compatible con el Éter disponible de ambos.
- Los juegos cortos permiten apuestas pequeñas; los largos, apuestas mayores.
- Nunca se debe permitir una apuesta superior al Éter disponible de cualquiera de los dos jugadores.
- La economía definitiva debe ser validada por servidor para evitar trampas.

## Catálogo inicial

Ta-Te-Ti, Reflejos, Tocar el objetivo, Piedra/Papel/Tijera, Memoria rápida, Quiz Éter, Conecta 4, Damas, Batalla naval, Truco y Éter Caos.

## Proximidad

El detector puede mostrar concentración aproximada de Éter cercana: **BAJO / ALTO / EXTREMO**. No muestra posiciones exactas ni el mail de nadie.

## Diseño

La interfaz 2.1 fue rediseñada mobile-first con estética de energía/ciencia ficción: fondo profundo, vidrio oscuro, neón, gradientes, tarjetas compactas, avatar con marco vivo y navegación inferior.

## Estado técnico

`index.html` ya está preparado para autenticación Google mediante Supabase Auth usando una clave publishable y para asociar el jugador a `auth.users.id`. El código no guarda contraseñas.

Para producción todavía hay que conectar el proyecto Supabase **exclusivo de Éter**, habilitar Google como proveedor OAuth y crear la tabla de jugadores con sus políticas RLS. No se debe reutilizar el backend de A220.

Éter es independiente de A220 y no comparte backend, datos ni infraestructura con A220.
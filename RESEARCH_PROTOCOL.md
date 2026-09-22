# Protocolo de investigación — Nazer π Lab

## Objetivo

Estudiar, en prefijos finitos, el cierre bajo reversión de los bloques de dígitos de varias constantes. El proyecto no presupone que exista una propiedad especial de π.

## Definiciones

Sea `D[0:N]` un prefijo de longitud `N`. Para una longitud `L`, definimos:

- `B(N,L)`: conjunto de bloques distintos de longitud `L` presentes en el prefijo.
- `S^R`: reverso de `S`.
- **Bloque unilateral**: `S ∈ B(N,L)` pero `S^R ∉ B(N,L)`.
- **Cierre bajo reversión**: no existe ningún bloque unilateral.
- `L*`: menor `L` analizado que presenta al menos un bloque unilateral.

## Reglas de validez

1. El resultado se refiere únicamente al prefijo usado.
2. No se debe interpretar un bloque unilateral en un prefijo como prueba de que su reverso nunca aparece en la expansión infinita.
3. Todos los comparadores deben usar el mismo `N`, `L`, base numérica y criterio de limpieza.
4. Los datos deben conservar su procedencia, número de dígitos, hash y fecha de obtención.
5. Los resultados negativos y positivos deben conservarse; no se descartan ejecuciones que contradigan una hipótesis.
6. Los experimentos exploratorios no prueban normalidad, disyuntividad ni una propiedad universal de π.

## Fases

### Fase A — Validación de datos

- Confirmar que cada archivo contiene solo dígitos válidos después de la limpieza.
- Registrar longitud disponible.
- Registrar SHA-256 del archivo original y de la secuencia limpia.
- Confirmar que el prefijo usado tiene exactamente `N` dígitos.

### Fase B — Comprobación exhaustiva del prefijo

Para cada `L` dentro del rango elegido:

1. Enumerar todas las ventanas de longitud `L`.
2. Construir el conjunto de bloques distintos.
3. Comprobar cada bloque contra su reverso.
4. Registrar cantidad de distintos, cantidad de unilaterales, primer bloque reproducible y posición de aparición.
5. Registrar el tiempo y memoria aproximados cuando estén disponibles.

### Fase C — Comparación entre constantes

Ejecutar el mismo protocolo para π, e, √2 y φ. No comparar resultados obtenidos con diferentes `N` o diferentes rangos de `L` como si fueran equivalentes.

### Fase D — Modelos nulos

Comparar con:

- Secuencias IID uniformes de dígitos 0–9.
- Secuencias con distribución marginal equivalente.
- Modelos Markov de orden 1 y 2, cuando existan datos suficientes.

Usar semillas registradas y réplicas independientes. Informar intervalos de incertidumbre y no solo un valor extremo.

### Fase E — Robustez

Repetir el análisis con:

- Prefijos crecientes.
- Diferentes longitudes `L`.
- Diferentes constantes.
- Diferentes semillas.
- Distintos modelos nulos.
- Diferentes implementaciones independientes cuando sea posible.

## Interpretación

Un resultado consistente y extremo puede justificar una investigación matemática adicional. No constituye por sí mismo una demostración sobre infinitos dígitos. Una afirmación universal requiere una prueba matemática o un resultado teórico aplicable a la constante estudiada.

## Registro mínimo por ejecución

- Versión del código o commit.
- Nombre de la constante.
- Base.
- `N`.
- Rango de `L`.
- Fuente y hash de datos.
- Semilla, si corresponde.
- Modelo nulo, si corresponde.
- Resultado completo, incluidos fallos y excepciones.
- Fecha y entorno de ejecución.

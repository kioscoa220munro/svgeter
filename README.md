# Nazer π Lab

Laboratorio reproducible para estudiar bloques de dígitos y reversos en prefijos finitos de constantes matemáticas. Reemplaza el concepto original de Éter dentro de este repositorio.

> **Alcance:** los resultados son propiedades de prefijos finitos. No demuestran normalidad, disyuntividad ni la aparición o ausencia eterna de un bloque en la expansión infinita.

## Componentes

- `index.html`: interfaz web local para cargar archivos y explorar resultados.
- `research_runner.py`: ejecutor reproducible en Python que genera CSV, metadatos y hashes SHA-256.
- `RESEARCH_PROTOCOL.md`: protocolo de validación, comparación, modelos nulos y robustez.

## Funciones de la interfaz

- Carga local de archivos TXT con dígitos de π, e, √2 y φ.
- Selección del prefijo `N` y de `L_MAX`.
- Modo de búsqueda del primer `L` unilateral.
- Modo de análisis de todas las longitudes hasta `L_MAX`.
- Detección de bloques `S` cuyo reverso `Sᴿ` no aparece en el mismo prefijo.
- Selección reproducible del bloque unilateral lexicográficamente menor.
- Tabla de ventanas, bloques distintos, unilaterales, bloque y reverso.

## Definición

Para un prefijo de longitud `N`, sea `B_N^(L)` el conjunto de bloques de longitud `L` presentes en ese prefijo. Se comprueba:

```text
S ∈ B_N^(L)  =>  reverse(S) ∈ B_N^(L)
```

Un bloque unilateral es un bloque presente cuyo reverso no está presente en el mismo prefijo.

## Uso web

1. Abrir `index.html` mediante GitHub Pages o un servidor local.
2. Cargar uno o varios archivos TXT con los dígitos.
3. Elegir `N`, `L máximo` y el modo.
4. Ejecutar el análisis.

## Uso reproducible en Python

Los archivos esperados son:

```text
pi_digits.txt
e_digits.txt
sqrt2_digits.txt
phi_digits.txt
```

Ejemplo:

```bash
python research_runner.py --n 1000 10000 100000 --l-max 12
```

Para analizar todas las longitudes dentro del límite:

```bash
python research_runner.py --n 1000 10000 --l-max 12 --all-lengths
```

Se generan:

- `research_results.csv`: resultados por constante, `N` y `L`.
- `research_results.csv.meta.json`: parámetros básicos de la ejecución.

El ejecutor registra el SHA-256 del archivo original y de la secuencia limpia. El nombre del archivo debe terminar en `_digits.txt`.

## Protocolo científico

Consultar `RESEARCH_PROTOCOL.md` antes de interpretar resultados. El protocolo exige:

1. Validación y trazabilidad de datos.
2. Igualdad de `N`, base y rango de `L` entre constantes.
3. Conservación de resultados positivos y negativos.
4. Comparación con modelos nulos aleatorios.
5. Repetición con prefijos crecientes y diferentes semillas.
6. Separación explícita entre resultados finitos y afirmaciones sobre infinitos dígitos.

## Próximas mejoras

- Exportación CSV desde la interfaz.
- Comparación automática de `L* - log10(N)`.
- Modelos IID, Markov-1 y Markov-2.
- Intervalos de incertidumbre y réplicas Monte Carlo.
- Gráficos de cobertura y concentración.
- Web Worker para no bloquear la interfaz en prefijos grandes.

# Nazer π Lab

Laboratorio reproducible para estudiar bloques de dígitos y sus reversos en **prefijos finitos** de secuencias numéricas. El repositorio fue reconvertido desde el concepto original de Éter.

> **Alcance:** una observación en un prefijo finito no demuestra por sí sola qué ocurre en la expansión infinita de una constante. El proyecto separa explícitamente observación computacional, evidencia estadística y demostración matemática.

## Estructura

- `index.html`: aplicación web.
- `research_worker.js`: Web Worker; evita congelar la interfaz durante el análisis.
- `research_engine.py`: motor Python exacto con codificación entera de ventanas.
- `research_runner.py`: CLI reproducible para análisis observado y Monte Carlo.
- `null_models.py`: modelos IID uniforme, IID marginal, Markov-1 y Markov-2.
- `tests/test_research_engine.py`: pruebas de regresión y de modelos nulos.
- `RESEARCH_PROTOCOL.md`: protocolo científico y reglas de interpretación.
- `pyproject.toml`: metadatos mínimos del proyecto Python.
- `.github/workflows/test.yml`: pruebas automáticas con Python 3.11, 3.12 y 3.13.

## Definición matemática

Para un prefijo de longitud (N) y una longitud (L), sea (B_{N,L}) el conjunto de bloques distintos de longitud (L).

Se comprueba:

[
S \in B_{N,L} \Rightarrow S^R \in B_{N,L}.
]

Un bloque es **unilateral** cuando (S) aparece pero (S^R) no aparece en el mismo prefijo.

Se registra además:

- `palindromic`: bloques que coinciden con su reverso.
- `unilateral`: número de bloques no palindrómicos cuyo reverso está ausente.
- `closed_pairs`: pares no palindrómicos donde aparecen ambas orientaciones.
- `reversal_pairs`: pares no palindrómicos representados al menos en una orientación.
- `coverage_pairs = closed_pairs / reversal_pairs`.
- `L*`: menor longitud analizada con al menos un unilateral.

Los palíndromos no se cuentan como pares de reversión.

## Aplicación web

1. Abrí `index.html` con GitHub Pages o un servidor local.
2. Cargá TXT con los dígitos.
3. Elegí (N), (L_{max}), constante y modo.
4. Ejecutá el análisis.
5. Exportá el resultado observado a CSV y los parámetros a JSON.
6. Ejecutá Monte Carlo desde el panel de modelos nulos.

La aplicación calcula SHA-256 de la **secuencia limpia**. La limpieza actual conserva únicamente ASCII `0`–`9`.

Para archivos muy grandes, usá el runner Python: el navegador usa `BigInt` y un Web Worker, pero no sustituye una ejecución de investigación controlada en equipo local.

## Runner Python

Los archivos de datos esperados terminan en `_digits.txt`, por ejemplo:

```text
pi_digits.txt
e_digits.txt
sqrt2_digits.txt
phi_digits.txt
```

Análisis observado:

```bash
python research_runner.py --n 1000 10000 100000 --l-max 12 --all-lengths
```

Primer (L) unilateral:

```bash
python research_runner.py --n 1000 10000 100000 --l-max 12
```

Con Monte Carlo:

```bash
python research_runner.py \
  --n 10000 100000 \
  --l-max 12 \
  --all-lengths \
  --null-reps 1000 \
  --null-model iid-uniform \
  --seed 220
```

Modelos disponibles:

- `iid-uniform`: dígitos independientes y uniformes.
- `iid-marginal`: independientes con las frecuencias marginales de la secuencia fuente.
- `markov1`: transición de primer orden estimada de la fuente, con respaldo a la marginal.
- `markov2`: transición de segundo orden estimada, con respaldo a Markov-1 y marginal.

## Archivos de salida

Con `--output research_results.csv`:

- `research_results.csv`: resultados observados.
- `research_results.csv.meta.json`: timestamp UTC, commit cuando está disponible, versión de Python, plataforma, parámetros y hashes.
- `research_results_null.csv`: resúmenes de las réplicas del modelo nulo.
- `research_results_first_l_null.csv`: comparación de (L^*) frente al modelo nulo.

Los p-valores del runner son **empíricos** y usan la corrección ((1+k)/(R+1)); deben reportarse junto con el número de réplicas y la semilla.

## Pruebas

No hacen falta dependencias externas para las pruebas básicas:

```bash
python -m unittest discover -s tests -v
```

La integración continua ejecuta esas mismas pruebas en tres versiones de Python.

## Buenas prácticas de investigación

Mantener siempre el mismo (N), base, rango de (L), fuente de datos y criterio de limpieza entre comparadores. Conservar ejecuciones que contradigan la hipótesis. Registrar semillas. Separar análisis exploratorio de análisis confirmatorio.

Una desviación respecto de un modelo nulo no constituye automáticamente una explicación matemática. Una afirmación sobre infinitos dígitos requiere un argumento matemático independiente o un teorema aplicable.

## Próximo paso lógico

Con datos verificables y suficientes, el flujo recomendado es:

`datos -> hashes -> prefijos N crecientes -> L -> pares de reversión -> modelos nulos -> replicación independiente -> análisis matemático`.


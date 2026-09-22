# Nazer π Lab

Aplicación web experimental para estudiar bloques de dígitos y reversos en prefijos finitos de constantes matemáticas.

> El proyecto reemplaza el concepto original de Éter. El repositorio se conserva como contenedor del nuevo laboratorio.

## Funciones actuales

- Carga local de archivos TXT con dígitos de π, e, √2 y φ.
- Selección del tamaño del prefijo `N`.
- Selección de la longitud máxima `L`.
- Modo de búsqueda del primer `L` unilateral.
- Modo de análisis de todas las longitudes hasta `L_MAX`.
- Detección de bloques `S` cuyo reverso `Sᴿ` no aparece en el mismo prefijo.
- Selección reproducible del bloque unilateral lexicográficamente menor.
- Tabla de resultados con ventanas, bloques distintos, unilaterales, bloque y reverso.
- Funcionamiento local en el navegador, sin Supabase ni backend.

## Definición

Para un prefijo de longitud `N`, sea `B_N^(L)` el conjunto de bloques de longitud `L` presentes en ese prefijo. La app comprueba si:

```text
S ∈ B_N^(L)  =>  reverse(S) ∈ B_N^(L)
```

El resultado es una propiedad del prefijo finito. No demuestra normalidad, disyuntividad, reversibilidad o irreversibilidad de la expansión infinita de una constante.

## Uso

1. Abrir `index.html` mediante GitHub Pages o un servidor local.
2. Cargar uno o varios archivos TXT con los dígitos.
3. Elegir `N`, `L máximo` y el modo.
4. Ejecutar el análisis.

## Archivos esperados

Los nombres pueden ser, por ejemplo:

```text
pi_digits.txt
e_digits.txt
sqrt2_digits.txt
phi_digits.txt
```

La aplicación elimina todos los caracteres que no sean dígitos ASCII.

## Próximas mejoras

- Exportación CSV desde la interfaz.
- Comparación automática de `L* - log10(N)`.
- Modelo nulo aleatorio y réplicas Monte Carlo.
- Gráficos de cobertura por longitud.
- Procesamiento con Web Worker para evitar bloquear la interfaz en prefijos grandes.

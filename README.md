# New Bee

Landing page con Flask e i18n JSON (fase inicial).

## Requisitos

- Python 3.10+

## Ejecutar

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

Abrir en navegador: `http://127.0.0.1:5000/`

## Idioma de interfaz

- Espanol: `/?lang=es`
- Ingles: `/?lang=en`

No se usan sesiones ni cookies para idioma.

## Estado actual

- Landing implementada.
- Ruta `/blog` como placeholder inicial para conectar con la siguiente fase.

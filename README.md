# Frontend Angular – Lab 4 (Sistemas Distribuidos, UPTC)
Habla únicamente con el Gateway.
```
npm install
npm start            # http://localhost:4200  (Gateway en environment.ts)
npm run build        # genera dist/app/browser -> subir a hosting estático
```
Antes de desplegar, edita `src/environments/environment.prod.ts` con la URL HTTPS del Gateway.
Recuerda habilitar CORS en el Gateway para el origen del frontend.

## Puntos a ajustar con su API real
- `core/auth.ts`: cuerpo del login (`username/password`), claim del id de estudiante y del rol.
- `core/api.ts`: rutas de archivos (fotos y PDFs) y filtro `materiaId` en `/api/materias/cursos`.

# 🚀 MeetBack - MVP

**MeetBack** es una app de valoraciones sociales donde los usuarios pueden ser evaluados por otros en aspectos como humor, sinceridad, fiabilidad o creatividad. Este repositorio contiene el backend del MVP desarrollado con **Node.js** y **MongoDB**.

---

## 🧠 Objetivo del proyecto

- Probar si existe interés en valorar y ser valorado públicamente.
- Construir una base inicial de usuarios que compartan su perfil.
- Minimizar riesgos legales y éticos desde el principio.

---

## 📦 Tech Stack

- **Backend:** Node.js, Express
- **Base de datos:** MongoDB + Mongoose
- **Auth:** JWT
- **Testing:** Jest
- **Filtro de lenguaje:** bad-words / sistema moderado
- **Deploy previsto:** Vercel / Netlify (frontend) + MongoDB Atlas

---

## ✨ Funcionalidades del MVP

### 🔐 Autenticación
- Registro e inicio de sesión con email.
- Crear `@handle` y nombre visible.

### 👤 Perfil público
- Foto, nombre y descripción corta.
- Etiquetas valoradas por otros (ej. confiable, divertido).
- Valoraciones promedio por aspecto (estilo 1 a 5 estrellas).
- Comentarios recibidos más recientes.

### ⭐ Valoraciones
- Valora a otros seleccionando aspectos y dejando un comentario opcional.
- Restricción de valoración repetida en pocos días.
- Filtro de lenguaje ofensivo.
- Sistema de reporte y revisión.

### 🛡️ Protección y control
- Valoraciones moderadas automáticamente.
- Reporte manual habilitado.
- Perfiles nuevos tienen menor peso en el sistema.

### 🏆 Ranking viral *(opcional en MVP)*
- Rankings por ciudad, edad, universidad, trabajo, etc.
- Ranking por atributo: "Los más sinceros de Sevilla", etc.

---

## 🧪 Tests

Los tests están en la carpeta `/src/__tests__/`. Usa:

```bash
npm test

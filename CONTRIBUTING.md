# 🤝 Contribuir a MeetBack

¡Gracias por tu interés en contribuir a **MeetBack**! Este documento explica cómo puedes colaborar de forma efectiva y segura al desarrollo de esta app.

---

## 🚀 Objetivo del proyecto

MeetBack es una app social que permite valorar a personas en aspectos como sinceridad, creatividad o humor, siempre con enfoque ético y control de contenido.

---

## 🌿 Flujo de trabajo

### 🔁 Rama principal: `main`
- **No se puede hacer push directo.**
- Solo se actualiza desde la rama `dev` a través de Pull Requests (PR).
- Solo el propietario del proyecto puede aceptar PRs hacia `main`.

### 🧪 Rama de desarrollo: `dev`
- Todas las nuevas funcionalidades deben partir desde aquí.
- Los colaboradores deben hacer PRs hacia `dev`.
- El owner puede subir cambios directamente a `dev`.

---

## 📌 Reglas para colaborar

1. **Crea un fork del repositorio.**
2. **Crea una rama para tu funcionalidad:**
   ```bash
   git checkout -b feat/nombre-de-tu-feature
   ```
3. **Commits con convención clara:**
   - `feat:` para nuevas funcionalidades
   - `fix:` para correcciones
   - `refactor:` para reestructurar sin cambiar lógica
   - `test:` para añadir o mejorar tests
   - `docs:` para cambios en la documentación

   Ejemplo:
   ```bash
   git commit -m "feat: añadir filtro de lenguaje ofensivo"
   ```

4. **Haz un Pull Request hacia `dev`.**
5. Añade una descripción clara de lo que hiciste.
6. Espera la revisión antes de que se mergee.

---

## ✅ Buenas prácticas

- Escribe código limpio y legible.
- Acompaña funcionalidades nuevas con tests cuando sea posible.
- No subas datos sensibles ni secretos.
- Usa el archivo `.env.example` si necesitas variables de entorno.

---

## 🛠️ Entorno de desarrollo rápido

```bash
# Instalar dependencias
npm install

# Ejecutar servidor en desarrollo
npm run dev

# Ejecutar tests
npm test
```

---

## 🛡️ Código de conducta

Se espera respeto y profesionalismo. Los comentarios ofensivos, ataques personales o contenido inapropiado no serán tolerados. Todos los perfiles deben tener consentimiento para estar en la plataforma.

---

## 📬 Contacto

Para dudas o ideas, puedes abrir un Issue o contactar al owner del repositorio.

---

¡Gracias por ayudar a construir MeetBack! 🌟

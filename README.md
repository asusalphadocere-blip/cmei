# Escucharnos para construir juntas 💜⚡

> **Tablero colaborativo en tiempo real para el taller participativo (focus group + ideatón) de Mujeres en Ingeniería UDP · CMEI.**  
> Diseñado para usarse durante la sesión en Zoom el **21 de octubre, 13:00–14:30**.

---

## 🌟 Características principales

1. **Participantes (Ruta `/`)**:
   - **100% Anónimas**: Sin cuenta, sin registro ni recolección de datos personales.
   - **Diseño Mobile-First**: Optimizado para celular, con botones grandes y navegación cómoda a una sola mano.
   - **Pestaña "Aportar"**: Selector por chips de sección, caja de texto de máx. 280 caracteres con previsualización en vivo del color del post-it y feed en tiempo real.
   - **Pestaña "Votar"**: Priorización de ideas en las columnas 1 a 4. Cada participante tiene un límite estricto de **2 votos en total** (controlado localmente vía `localStorage`).
   - **Pestaña "Tablero"**: Visualización compacta en el móvil del tablero completo.

2. **Facilitadora (Ruta `/panel`)**:
   - **Protegido por PIN**: Validación en el servidor (`POST /api/pin`) contra `FACILITATOR_PIN`, nunca expuesto en el cliente.
   - **Diseño idéntico a la lámina del taller**: Pizarra basada en la diagramación original de CMEI UDP.
   - **Pantalla completa / Modo Zoom**: Diseñado específicamente para compartir pantalla en Zoom de forma nítida.
   - **Selector de Fases**: Permite a la facilitadora enfocar rápidamente la fase correspondiente de la agenda (Diagnóstico, Priorización, Probar algo pequeño o Seguir conectadas).
   - **Moderación**: Botón ✕ con confirmación para eliminar post-its inapropiados o duplicados.
   - **Exportación**: Descarga en un clic de la memoria del taller en formato CSV estructurado.

---

## 🏗️ Estructura del Tablero

- **Fila 1 (Diagnóstico - 4 columnas)**:
  1. `Intereses`: *(¿Qué nos importa?)*
  2. `Habilidades`: *(¿Qué sabemos hacer y qué queremos aprender?)*
  3. `Recursos y apoyos`: *(¿Con qué contamos o qué necesitamos?)*
  4. `Barreras`: *(¿Qué nos dificulta avanzar?)*
- **Fila 2 (Dos bloques)**:
  - **Priorizamos juntas**: Ranking en vivo de las 6 ideas más votadas de las columnas 1 a 4 + matriz visual de stickers de votación.
  - **Probar algo pequeño** (Ideatón rápida en 3 columnas):
    - *Idea* (¿Para quién?)
    - *Prueba* (¿Qué podemos probar con lo que ya tenemos?)
    - *Aprender* (¿Cómo sabremos si ayudó?)
- **Fila 3 (Seguir conectadas - 3 cajas)**:
  - *Próximo paso voluntario*
  - *¿Quién quiere aportar?*
  - *Podemos corregir, dejar una pregunta o pasar*

---

## 📋 Guía paso a paso de configuración y despliegue

### Paso 1: Configurar Firebase Realtime Database

1. Ve a la consola de [Firebase Console](https://console.firebase.google.com/) y selecciona tu proyecto (`udp-cmei-focusgroup`).
2. En el menú lateral izquierdo, haz clic en **Build** (Compilación) > **Realtime Database**.
3. Si aún no está creada, haz clic en **Crear base de datos**. Selecciona la ubicación predeterminada y elige **Iniciar en modo bloqueado**.
4. Una vez creada la base de datos, dirígete a la pestaña **Reglas** (Rules).
5. Borra el contenido existente y pega exactamente las reglas contenidas en `database.rules.json`:

```json
{
  "rules": {
    "notes": {
      ".read": true,
      "$noteId": {
        ".write": "(!data.exists() && newData.exists() && newData.hasChildren(['sec', 'text', 'ts', 'votes']) && newData.child('votes').val() === 0 && newData.child('text').isString() && newData.child('text').val().length >= 1 && newData.child('text').val().length <= 280 && newData.child('sec').isString()) || (data.exists() && newData.exists() && newData.child('votes').val() === data.child('votes').val() + 1 && newData.child('text').val() === data.child('text').val() && newData.child('sec').val() === data.child('sec').val() && newData.child('ts').val() === data.child('ts').val()) || (data.exists() && !newData.exists())",
        "sec": {
          ".validate": "newData.isString()"
        },
        "text": {
          ".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 280"
        },
        "ts": {
          ".validate": "newData.isNumber()"
        },
        "votes": {
          ".validate": "newData.isNumber() && newData.val() >= 0"
        },
        "$other": {
          ".validate": false
        }
      }
    },
    "$other": {
      ".read": false,
      ".write": false
    }
  }
}
```
6. Haz clic en **Publicar** (Publish).

---

### Paso 2: Cargar las Variables de Entorno en Vercel

En el panel de tu proyecto en **Vercel** (`Settings` > `Environment Variables`), agrega las siguientes variables para los entornos *Production* y *Preview*:

| Variable | Valor de ejemplo / Descripción |
| :--- | :--- |
| `FIREBASE_API_KEY` | Tu API Key de Firebase (ej: `AIzaSyAkw...`) |
| `FIREBASE_AUTH_DOMAIN` | `udp-cmei-focusgroup.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | `udp-cmei-focusgroup` |
| `FIREBASE_DATABASE_URL` | `https://udp-cmei-focusgroup-default-rtdb.firebaseio.com` |
| `FIREBASE_APP_ID` | `1:889358605926:web:86d9351d501ad546c6d7a7` |
| `FACILITATOR_PIN` | PIN secreto elegido por las facilitadoras (ej: `2110`) |

> **Nota de seguridad:** Nunca compartas el `FACILITATOR_PIN` con las participantes ni lo subas a repositorios públicos de GitHub.

---

### Paso 3: Despliegue en Vercel

1. Sube este repositorio a GitHub con el tag de versión `v1.0`.
2. En Vercel, haz clic en **Add New Project** e importa el repositorio.
3. En **Framework Preset**, puedes dejarlo en **Vite** o **Other** (funciona automáticamente ya que `vite build` genera la carpeta `dist` y `/api` maneja las serverless functions).
4. Despliega el proyecto haciendo clic en **Deploy**.

---

### Paso 4: Prueba con Dos Dispositivos

1. **Dispositivo 1 (Laptop de Facilitadora)**:
   - Abre el navegador e ingresa a `https://tu-app.vercel.app/panel`.
   - Ingresa el PIN configurado en `FACILITATOR_PIN` (ej: `2110`).
   - Verifica que el tablero cargue con el indicador verde de *"Tiempo Real Conectado"*.
   - Haz clic en **"Copiar enlace participantes"**.
2. **Dispositivo 2 (Celular de Participante o ventana de incógnito)**:
   - Pega el enlace copiado (ruta `/`).
   - Ve a la pestaña **Aportar**, selecciona una sección (ej. *1. Intereses*), escribe una idea y presiona **"Enviar post-it al tablero"**.
   - En menos de 1 segundo, observa cómo la tarjeta aparece automáticamente en la pantalla de la facilitadora sin recargar.
   - Ve a la pestaña **Votar**, emite un voto y observa cómo se actualiza el contador de votos y la matriz gráfica en el panel.

---

## ⚠️ Limitación conocida

> **Documentación v1.0:**  
> En la versión **v1.0**, el PIN protege la interfaz visual del panel de facilitadora en `/panel`; el borrado directo de notas en la base de datos se realiza según las reglas de escritura de Firebase (`database.rules.json`). En la versión **v1.1**, se implementará la emisión de un Custom Auth Token de Firebase tras la validación exitosa del PIN en `/api/pin` para firmar criptográficamente las operaciones de borrado.

---

## 🛠️ Desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env local a partir de .env.example
cp .env.example .env

# 3. Iniciar servidor de desarrollo (puerto 3000)
npm run dev
```

---

*Desarrollado con compromiso e inclusión para Mujeres en Ingeniería UDP · CMEI.*

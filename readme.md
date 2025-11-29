## Descripción
Aplicación móvil desarrollada en React Native para la gestión de una librería o biblioteca. Permite registrar, listar y detallar libros, con integración a la API de Google Books para búsquedas automáticas. Incluye un sistema de roles (admin y user), gestión de préstamos con aprobaciones, stock limitado, notificaciones y persistencia de datos local. La app simula una base de datos usando AsyncStorage para almacenar libros y notificaciones en formato JSON.

La app está diseñada para:
- Admins: Registrar/editar/eliminar libros, aprobar/rechazar préstamos, definir stock y vigencia.
- Users: Ver libros disponibles, solicitar préstamos y devolver libros propios.

## Funcionalidades Principales
### General
- **Login**: Autenticación simple con usuarios hardcoded (admin/admin, user/user). Redirige a dashboard según rol.
- **Persistencia**: Libros y notificaciones guardados en AsyncStorage (JSON local).
- **Búsqueda de Libros**: Integración con Google Books API para buscar por título, mostrar resultados en modal, seleccionar y llenar campos automáticamente (campos se vuelven read-only post-selección).
- **Notificaciones**: Modales para admins (solicitudes pendientes) y users (aprobaciones con detalles de admin, fecha/hora, vigencia).

### Para Admins
- **Registro de Libros**: Formulario con campos (título, autor, año, género, ISBN, stock). Búsqueda API y validaciones avanzadas (Formik + Yup).
- **Edición/Eliminación**: En detalles, editar campos (con búsqueda) y eliminar libros.
- **Gestión de Préstamos**: Ver solicitante, fecha/hora de solicitud. Aprobar (definir días de vigencia, bajar stock) o rechazar. Forzar devolución (subir stock).
- **Dashboard**: Lista de solicitudes pendientes con detalles y acciones.

### Para Users
- **Lista de Libros**: Solo ve libros disponibles (status 'available' y stock > 0). Búsqueda por título/autor/ISBN.
- **Solicitar Préstamo**: En detalles, si disponible. Muestra alert "Préstamo solicitado".
- **Devolver Libro**: Solo para libros prestados a ellos (sube stock).
- **Notificaciones**: Modal en home con aprobaciones (incluye admin, fecha/hora, vigencia).

### Otras Funcionalidades
- **Stock**: Admin define al registrar. Baja al prestar, sube al devolver.
- **Vigencia Préstamo**: Admin define días; calcula fecha fin (borrowUntil).
- **Timestamps**: requestedAt, approvedAt para tracking.
- **Loaders**: ActivityIndicator durante búsquedas API.

## Tecnologías Usadas
- **Framework**: React Native (para iOS/Android).
- **Navegación**: React Navigation (Stack Navigator).
- **Formularios y Validaciones**: Formik (manejo de forms), Yup (esquemas de validación).
- **Almacenamiento Local**: AsyncStorage (persistencia de libros/notificaciones en JSON).
- **API Externa**: Google Books API (búsquedas por título).
- **UI Components**: React Native built-ins (TextInput, Button, FlatList, Modal, ActivityIndicator, etc.).
- **Estado Global**: useState/useEffect en App.js para compartir books, notifications, currentUser.
- **Otras**: Date para timestamps, JSON para serialización.

## Dependencias
Instala con `npm install` o `yarn add`:
- `@react-navigation/native`
- `@react-navigation/native-stack`
- `react-native-safe-area-context`
- `react-native-screens`
- `formik`
- `yup`
- `@react-native-async-storage/async-storage`

**package.json ejemplo** (extracto):
```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.23.1",
    "@react-navigation/native": "^6.1.17",
    "@react-navigation/native-stack": "^6.11.0",
    "formik": "^2.4.6",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-safe-area-context": "^4.10.5",
    "react-native-screens": "^3.31.1",
    "yup": "^1.4.0"
  }
}
```

## Usuarios y Roles
- **Usuarios Hardcoded** (en App.js; en producción, usa auth real como Firebase):
  - Admin: username 'admin', password 'admin', role 'admin'.
  - User: username 'user', password 'user', role 'user'.
- **Roles**:
  - **Admin**: Acceso completo (registrar/editar/eliminar libros, aprobar/rechazar préstamos, ver dashboard con solicitudes).
  - **User**: Solo ver lista disponible, solicitar/devolver préstamos, recibir notificaciones.

## Estructura de Directorios
```
Root/
├── App.js  # Entrada principal, estado global, navegación
└── screens/
    ├── LoginScreen.js  # Login form
    ├── HomeScreen.js  # Home con notificaciones para users
    ├── AdminDashboard.js  # Dashboard admin con solicitudes
    ├── RegisterBookScreen.js  # Registro con stock
    ├── BookListScreen.js  # Lista con filtro por rol/stock
    └── BookDetailScreen.js  # Detalles con acciones por rol, timestamps
```

## Cómo Correr la App
1. **Inicializar Proyecto**: `npx react-native init LibraryApp`.
2. **Instalar Dependencias**: `npm install` (ver arriba).
3. **Reemplazar Archivos**: Copia el código proporcionado en App.js y screens/.
4. **Configurar API Key**: En RegisterBookScreen y BookDetailScreen, reemplaza 'YOUR_API_KEY_HERE' con tu Google Books API key.
5. **Correr**: `npx react-native run-android` o `npx react-native run-ios`.
6. **Probar**:
   - Login como 'admin' para gestión.
   - Login como 'user' para préstamos.
   - Registra libros con stock >1 para pruebas múltiples.

## Notas Adicionales
- **Seguridad**: Usuarios hardcoded; no para producción. Usa Firebase/Auth0.
- **API**: Requiere Google Books API key (gratuita, limitada).
- **Persistencia**: Local (AsyncStorage); no sincronizada entre dispositivos.
- **Mejoras Futuras**: Backend real (Firebase/Firestore), push notifications (Expo/FCM), escaneo ISBN (react-native-camera), autenticación segura.
- **Limitaciones**: Sin manejo de vencimientos automáticos (e.g., alertas overdue). Stock simple (no maneja múltiples copias detalladas).
- **Desarrollado**: Basado en iteraciones, con fecha actual November 28, 2025.

Para contribuciones o issues, clona el repo y PR. ¡Disfruta gestionando tu librería!

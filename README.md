# 📚 Sistema de Gestión de Biblioteca

Un sistema completo de gestión de biblioteca desarrollado con **React** (Frontend) y **Node.js + Prisma** (Backend), con base de datos **PostgreSQL**.

## 🚀 Características Principales

### 📖 Gestión de Libros
- ✅ **CRUD completo** de libros (Crear, Leer, Actualizar, Eliminar)
- ✅ **Campos**: Título, Autor, Editorial, ISBN, Año de publicación
- ✅ **Validaciones**: ISBN único, año válido (>1500)
- ✅ **Interfaz intuitiva** con Material-UI

### 👥 Gestión de Usuarios
- ✅ **CRUD completo** de usuarios
- ✅ **Campos**: Nombre, Email, Teléfono, Dirección
- ✅ **Sistema de roles**: Estudiante, Profesor, Investigador, Visitante
- ✅ **Validaciones**: Email único, formatos válidos
- ✅ **Eliminación segura** con verificación de dependencias

### 📋 Gestión de Préstamos
- ✅ **CRUD completo** de préstamos
- ✅ **Campos**: Usuario, Ejemplar, Bibliotecario, Fecha de devolución
- ✅ **Estados**: Pendiente, Activo, Devuelto, Atrasado
- ✅ **Validaciones**: Ejemplar disponible, fechas válidas
- ✅ **Actualización automática** del estado de ejemplares

### 🏗️ Arquitectura del Sistema
- ✅ **Frontend**: React + Material-UI + Axios
- ✅ **Backend**: Node.js + Express + Prisma ORM
- ✅ **Base de datos**: PostgreSQL con esquema complejo
- ✅ **Relaciones**: Foreign keys, triggers, vistas, funciones

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React** 18+ con Hooks
- **Material-UI** para componentes UI
- **Axios** para peticiones HTTP
- **Vite** para desarrollo rápido

### Backend
- **Node.js** con Express.js
- **Prisma ORM** para manejo de base de datos
- **PostgreSQL** como base de datos principal
- **CORS** para comunicación frontend-backend

### Base de Datos
- **PostgreSQL** con esquema avanzado
- **14 tablas** interrelacionadas
- **Triggers automáticos** para integridad
- **Vistas** para consultas optimizadas
- **Funciones PL/pgSQL** para lógica de negocio

## 📁 Estructura del Proyecto

```
proyecto-biblioteca/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Users.jsx          # Gestión de usuarios
│   │   │   ├── Books.jsx          # Gestión de libros
│   │   │   ├── Loans.jsx          # Gestión de préstamos
│   │   │   └── Ejemplares.jsx     # Gestión de ejemplares
│   │   ├── services/
│   │   │   └── api.js             # Configuración de API
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── controllers/
│   │   ├── userController.js      # Lógica de usuarios
│   │   ├── bookController.js      # Lógica de libros
│   │   └── loanController.js      # Lógica de préstamos
│   ├── routes/
│   │   ├── userRoutes.js          # Rutas de usuarios
│   │   ├── bookRoutes.js          # Rutas de libros
│   │   └── loanRoutes.js          # Rutas de préstamos
│   ├── generated/
│   │   └── prisma/                # Cliente Prisma generado
│   ├── server.js                  # Servidor principal
│   └── package.json
└── database/
    └── schema.sql                 # Script de base de datos
```

## ⚙️ Instalación y Configuración

### 1. Prerequisitos
- **Node.js** 16+ 
- **PostgreSQL** 12+
- **npm** o **yarn**

### 2. Configuración de Base de Datos
```sql
-- Ejecutar el script completo de base de datos
psql -U postgres -d nombre_bd -f database/schema.sql
```

### 3. Configuración del Backend
```bash
cd backend
npm install

# Configurar variables de entorno
echo "DATABASE_URL=postgresql://usuario:password@localhost:5432/biblioteca_db" > .env

# Generar cliente Prisma
npx prisma generate

# Iniciar servidor
npm start
# Servidor corriendo en http://localhost:3000
```

### 4. Configuración del Frontend
```bash
cd frontend
npm install

# Iniciar aplicación
npm run dev
# Aplicación corriendo en http://localhost:5173
```

## 🔗 Endpoints de la API

### Usuarios
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `POST /api/users` - Crear nuevo usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Libros
- `GET /api/books` - Obtener todos los libros
- `GET /api/books/:id` - Obtener libro por ID
- `POST /api/books` - Crear nuevo libro
- `PUT /api/books/:id` - Actualizar libro
- `DELETE /api/books/:id` - Eliminar libro

### Préstamos
- `GET /api/loans` - Obtener todos los préstamos
- `GET /api/loans/:id` - Obtener préstamo por ID
- `POST /api/loans` - Crear nuevo préstamo
- `PUT /api/loans/:id` - Actualizar préstamo
- `DELETE /api/loans/:id` - Eliminar préstamo

## 💾 Esquema de Base de Datos

### Tablas Principales
- **usuarios** - Información de usuarios del sistema
- **libros** - Catálogo de libros
- **ejemplares** - Copias físicas de los libros
- **prestamos** - Registro de préstamos
- **bibliotecarios** - Personal de la biblioteca
- **roles** - Tipos de usuario (Estudiante, Profesor, etc.)

### Tablas de Relación
- **usuarios_roles** - Relación N:M usuarios-roles
- **libros_categorias** - Relación N:M libros-categorías

### Tablas de Gestión
- **reservas** - Reservas de libros
- **multas** - Multas por retrasos
- **historial_prestamos** - Historial de préstamos
- **inventarios** - Control de inventario

## 🎯 Funcionalidades Avanzadas

### Validaciones Automáticas
- ✅ **Email único** en usuarios
- ✅ **ISBN único** en libros
- ✅ **Ejemplar disponible** antes de préstamo
- ✅ **Fechas coherentes** en préstamos

### Actualizaciones Automáticas
- ✅ **Estado de ejemplar** cambia a "prestado" al crear préstamo
- ✅ **Estado de ejemplar** cambia a "disponible" al devolver
- ✅ **Eliminación en cascada** respetando foreign keys

### Manejo de Errores
- ✅ **Mensajes específicos** por tipo de error
- ✅ **Validación en frontend** antes de enviar
- ✅ **Logging detallado** para debugging
- ✅ **Rollback automático** en transacciones

## 🚨 Solución de Problemas

### Error: "Foreign key constraint violated"
**Problema**: Al eliminar usuarios con dependencias
**Solución**: El sistema elimina automáticamente las dependencias en orden:
1. usuarios_roles
2. multas  
3. reservas
4. prestamos
5. usuario

### Error: "Ejemplar no está disponible"
**Problema**: Intentar prestar un ejemplar ya prestado
**Solución**: El sistema solo muestra ejemplares disponibles en el dropdown

### Error: "CORS policy"
**Problema**: Frontend no puede comunicarse con backend
**Solución**: Verificar que el backend esté corriendo en puerto 3000

## 🧪 Testing

### Probar la API directamente
```bash
# Obtener usuarios
curl http://localhost:3000/api/users

# Crear usuario
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test User","email":"test@email.com","roles":[1]}'

# Obtener préstamos
curl http://localhost:3000/api/loans
```

### Verificar Base de Datos
```sql
-- Verificar usuarios
SELECT * FROM usuarios LIMIT 5;

-- Verificar préstamos activos
SELECT * FROM prestamos WHERE estado = 'activo';

-- Verificar ejemplares disponibles
SELECT * FROM ejemplares WHERE estado = 'disponible';
```

## 📈 Datos de Prueba

El sistema incluye **1000+ registros** de prueba:
- ✅ **50 usuarios** con roles asignados
- ✅ **100 libros** con categorías
- ✅ **300 ejemplares** en diferentes salas
- ✅ **200 préstamos** con estados variados
- ✅ **100 reservas** y **50 multas**

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

Desarrollado como proyecto académico para el curso de Base de Datos.

---

## 🆘 Soporte

Si encuentras algún problema:

1. **Revisa los logs** del backend y frontend
2. **Verifica la conexión** a la base de datos
3. **Confirma que los puertos** 3000 (backend) y 5173 (frontend) estén libres
4. **Ejecuta las migraciones** de Prisma si es necesario

**¡Feliz gestión de biblioteca! 📚✨**

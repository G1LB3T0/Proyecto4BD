const getUserRoleNames = (userRoles) => {
    if (!userRoles || userRoles.length === 0) return 'Sin rol';
    return userRoles.map(ur => ur.roles.nombre).join(', ');
  };import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  IconButton,
  Box,
  Chip
} from '@mui/material';
import { Edit, Delete, Add, Person, Info } from '@mui/icons-material';
import { api } from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    roles: [1] // Por defecto, asignar rol ID 1
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Obteniendo usuarios desde:', 'http://localhost:3000/api/users');
      const response = await api.getUsers();
      console.log('Usuarios obtenidos:', response.data);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Error al cargar los usuarios';
      
      if (error.response?.status === 404) {
        errorMessage = 'Endpoint de usuarios no encontrado. Verifica que el servidor esté corriendo en puerto 3000';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Error del servidor';
      } else if (!error.response) {
        errorMessage = 'Error de conexión. Verifica que el servidor esté corriendo en http://localhost:3000';
      }
      
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    
    // Verificar si el email ya existe (solo para nuevos usuarios)
    if (!editingUser && users.some(user => user.email === formData.email)) {
      newErrors.email = 'Este email ya está registrado';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre || '',
        email: user.email || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        roles: user.usuarios_roles?.map(ur => ur.roles.id) || [1]
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        direccion: '',
        roles: [1] // Rol por defecto
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      roles: [1]
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'roles') {
      // Convertir a array con el ID del rol seleccionado
      setFormData(prev => ({
        ...prev,
        [name]: [parseInt(value)]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      console.log('Enviando datos:', formData); // Debug
      
      if (editingUser) {
        console.log('Actualizando usuario ID:', editingUser.id);
        const response = await api.updateUser(editingUser.id, formData);
        console.log('Respuesta actualización:', response);
        showSnackbar('Usuario actualizado exitosamente');
      } else {
        console.log('Creando nuevo usuario');
        const response = await api.createUser(formData);
        console.log('Respuesta creación:', response);
        showSnackbar('Usuario creado exitosamente');
      }
      
      fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Error al guardar el usuario';
      
      if (error.response) {
        // Error del servidor
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 400:
            errorMessage = data?.message || 'Datos inválidos';
            break;
          case 401:
            errorMessage = 'No autorizado';
            break;
          case 404:
            errorMessage = 'Usuario no encontrado';
            break;
          case 409:
            errorMessage = 'El email ya está registrado';
            break;
          case 422:
            errorMessage = data?.message || 'Error de validación';
            break;
          case 500:
            errorMessage = 'Error interno del servidor';
            break;
          default:
            errorMessage = data?.message || `Error ${status}`;
        }
      } else if (error.request) {
        // Error de red
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      } else {
        // Error de configuración
        errorMessage = 'Error de configuración';
      }
      
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDelete = async (id) => {
    const user = users.find(u => u.id === id);
    
    try {
      console.log('Eliminando usuario ID:', id);
      await api.deleteUser(id);
      showSnackbar('Usuario eliminado exitosamente');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response details:', error.response?.data?.details);
      console.error('Error response error:', error.response?.data?.error);
      
      let errorMessage = 'Error al eliminar el usuario';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        // Log completo de la respuesta para debugging
        console.log('Status:', status);
        console.log('Data completa:', JSON.stringify(data, null, 2));
        
        switch (status) {
          case 400:
            errorMessage = data?.message || data?.error || 'Datos inválidos para eliminación';
            break;
          case 404:
            errorMessage = 'Usuario no encontrado';
            break;
          case 409:
            errorMessage = 'Conflicto: El usuario tiene dependencias que impiden su eliminación';
            break;
          case 500:
            // Capturar diferentes tipos de mensajes de error del backend
            if (data?.details) {
              if (data.details.includes('Foreign key constraint violated') || 
                  data.details.includes('foreign key') || 
                  data.details.includes('constraint')) {
                errorMessage = `❌ No se puede eliminar el usuario "${user?.nombre || id}"\n\n` +
                              `PROBLEMA: El usuario tiene registros dependientes en:\n` +
                              `• Tabla usuarios_roles (roles asignados)\n` +
                              `• Tabla prestamos (préstamos realizados)\n` +
                              `• Tabla reservas (reservas activas)\n` +
                              `• Tabla multas (multas pendientes)\n\n` +
                              `SOLUCIÓN: Tu backend debe eliminar estas dependencias primero.\n` +
                              `Modifica tu userController.js para eliminar en orden:\n` +
                              `1. usuarios_roles\n2. multas\n3. reservas\n4. prestamos\n5. usuario`;
              } else if (data.details.includes('violates')) {
                errorMessage = `Error de integridad de base de datos: ${data.details}`;
              } else {
                errorMessage = `Error del servidor: ${data.details}`;
              }
            } else if (data?.error) {
              errorMessage = `Error: ${data.error}`;
            } else if (data?.message) {
              errorMessage = `Error: ${data.message}`;
            } else {
              errorMessage = 'Error interno del servidor - revisa la consola para más detalles';
            }
            break;
          default:
            errorMessage = data?.message || data?.error || data?.details || `Error HTTP ${status}`;
        }
      } else if (error.request) {
        errorMessage = 'Error de conexión con el servidor - verifica que esté ejecutándose';
      } else {
        errorMessage = `Error de configuración: ${error.message}`;
      }
      
      showSnackbar(errorMessage, 'error');
      
      // También mostrar el error en un alert para debugging
      if (process.env.NODE_ENV === 'development') {
        alert(`DEBUG INFO:\nStatus: ${error.response?.status}\nError: ${JSON.stringify(error.response?.data, null, 2)}`);
      }
    }
  };

  const checkUserDependencies = async (userId, userName) => {
    try {
      // Mostrar dialog de confirmación primero
      const confirmed = window.confirm(
        `¿Estás seguro de que quieres eliminar al usuario "${userName}"?\n\n` +
        `ADVERTENCIA: Esta acción eliminará:\n` +
        `- El usuario y todos sus datos\n` +
        `- Sus roles asignados\n` +
        `- Su historial (si el backend lo permite)\n\n` +
        `Esta acción NO se puede deshacer.`
      );
      
      if (confirmed) {
        // Proceder directamente con la eliminación
        await handleDelete(userId);
      }
      
    } catch (error) {
      console.error('Error in user deletion flow:', error);
      showSnackbar('Error en el proceso de eliminación', 'error');
    }
  };

  const getStatusColor = (userRoles) => {
    if (!userRoles || userRoles.length === 0) return 'default';
    
    // Determinar color basado en el rol principal
    const mainRole = userRoles[0]?.roles?.nombre?.toLowerCase();
    switch (mainRole) {
      case 'estudiante':
        return 'primary';
      case 'profesor':
        return 'success';
      case 'investigador':
        return 'warning';
      case 'visitante':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Cargando usuarios...</Typography>
      </Box>
    );
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Usuarios
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ mr: 1 }}
        >
          Agregar Usuario
        </Button>
        
        <Button 
          variant="outlined" 
          color="secondary"
          onClick={() => {
            console.log('Probando conexión con backend...');
            fetch('http://localhost:3000/api/users')
              .then(res => {
                console.log('Status:', res.status);
                return res.json();
              })
              .then(data => {
                console.log('Backend funcionando. Usuarios:', data.length);
                showSnackbar(`Backend OK - ${data.length} usuarios encontrados`, 'success');
              })
              .catch(err => {
                console.error('Backend error:', err);
                showSnackbar('Error: Backend no responde', 'error');
              });
          }}
        >
          Test Backend
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                    <Person sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                    <Typography variant="body2" color="textSecondary">
                      No hay usuarios registrados
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {user.nombre}
                    </Typography>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.telefono || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getUserRoleNames(user.usuarios_roles)} 
                      color={getStatusColor(user.usuarios_roles)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      color="info" 
                      onClick={() => checkUserDependencies(user.id, user.nombre)}
                      size="small"
                      title="Verificar dependencias"
                    >
                      <Info />
                    </IconButton>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenDialog(user)}
                      size="small"
                      title="Editar usuario"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => checkUserDependencies(user.id, user.nombre)}
                      size="small"
                      title="Eliminar usuario"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar usuario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              name="nombre"
              label="Nombre completo"
              value={formData.nombre}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!errors.nombre}
              helperText={errors.nombre}
            />
            
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!errors.email}
              helperText={errors.email}
            />
            
            <TextField
              name="telefono"
              label="Teléfono"
              value={formData.telefono}
              onChange={handleInputChange}
              fullWidth
              placeholder="Ej: +502 1234-5678"
            />
            
            <TextField
              name="direccion"
              label="Dirección"
              value={formData.direccion}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
              placeholder="Dirección completa"
            />
            
            <TextField
              name="roles"
              label="Rol"
              select
              value={formData.roles[0] || 1}
              onChange={handleInputChange}
              fullWidth
              SelectProps={{
                native: true,
              }}
            >
              <option value={1}>Estudiante</option>
              <option value={2}>Profesor</option>
              <option value={3}>Investigador</option>
              <option value={4}>Visitante</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Users;
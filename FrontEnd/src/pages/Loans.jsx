import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Box
} from '@mui/material';
import { Edit, Delete, Add, LibraryBooks } from '@mui/icons-material';
import { api } from '../services/api';

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Form state
  const [formData, setFormData] = useState({
    usuario_id: '',
    ejemplar_id: '',
    bibliotecario_id: '',
    fecha_devolucion: '',
    estado: 'activo'
  });

  // States for dropdowns
  const [usuarios, setUsuarios] = useState([]);
  const [ejemplares, setEjemplares] = useState([]);
  const [bibliotecarios, setBibliotecarios] = useState([]);

  // Form validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchLoans();
    fetchUsuarios();
    fetchEjemplares();
    fetchBibliotecarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await api.getUsers();
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchEjemplares = async () => {
    try {
      const response = await api.getEjemplares();
      setEjemplares(response.data.filter(ej => ej.estado === 'disponible'));
    } catch (error) {
      console.error('Error fetching ejemplares:', error);
      // Si no hay endpoint de ejemplares, usar datos mock
      setEjemplares([
        { id: 1, estado: 'disponible', libros: { titulo: 'Libro 1' } },
        { id: 2, estado: 'disponible', libros: { titulo: 'Libro 2' } },
        { id: 3, estado: 'disponible', libros: { titulo: 'Libro 3' } }
      ]);
    }
  };

  const fetchBibliotecarios = async () => {
    try {
      const response = await api.getBibliotecarios();
      setBibliotecarios(response.data);
    } catch (error) {
      console.error('Error fetching bibliotecarios:', error);
      // Datos mock si no hay endpoint
      setBibliotecarios([
        { id: 1, nombre: 'Ana García' },
        { id: 2, nombre: 'Carlos López' },
        { id: 3, nombre: 'Marta Rodríguez' }
      ]);
    }
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      console.log('Obteniendo préstamos desde:', 'http://localhost:3000/api/loans');
      const response = await api.getLoans();
      console.log('Préstamos obtenidos:', response.data);
      setLoans(response.data);
    } catch (error) {
      console.error('Error fetching loans:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Error al cargar los préstamos';
      
      if (error.response?.status === 404) {
        errorMessage = 'Endpoint de préstamos no encontrado. Verifica que el servidor esté corriendo en puerto 3000';
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
    
    if (!formData.usuario_id) {
      newErrors.usuario_id = 'El usuario es requerido';
    }
    
    if (!formData.ejemplar_id) {
      newErrors.ejemplar_id = 'El ejemplar es requerido';
    }
    
    if (!formData.bibliotecario_id) {
      newErrors.bibliotecario_id = 'El bibliotecario es requerido';
    }
    
    if (!formData.fecha_devolucion) {
      newErrors.fecha_devolucion = 'La fecha de devolución es requerida';
    }
    
    // Validar que la fecha de devolución sea futura
    if (formData.fecha_devolucion) {
      const fechaDevolucion = new Date(formData.fecha_devolucion);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
      
      if (fechaDevolucion <= hoy) {
        newErrors.fecha_devolucion = 'La fecha de devolución debe ser posterior a hoy';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenDialog = (loan = null) => {
    if (loan) {
      setEditingLoan(loan);
      setFormData({
        usuario_id: loan.usuario_id,
        ejemplar_id: loan.ejemplar_id,
        bibliotecario_id: loan.bibliotecario_id,
        fecha_devolucion: loan.fecha_devolucion?.split('T')[0] || '',
        estado: loan.estado
      });
    } else {
      setEditingLoan(null);
      // Calcular fecha de devolución por defecto (2 semanas desde hoy)
      const today = new Date();
      const returnDate = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000));
      setFormData({
        usuario_id: '',
        ejemplar_id: '',
        bibliotecario_id: '',
        fecha_devolucion: returnDate.toISOString().split('T')[0],
        estado: 'activo'
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingLoan(null);
    setFormData({
      usuario_id: '',
      ejemplar_id: '',
      bibliotecario_id: '',
      fecha_devolucion: '',
      estado: 'activo'
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('_id') ? parseInt(value) : value
    }));
    
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
      
      if (editingLoan) {
        console.log('Actualizando préstamo ID:', editingLoan.id);
        const response = await api.updateLoan(editingLoan.id, formData);
        console.log('Respuesta actualización:', response);
        showSnackbar('Préstamo actualizado exitosamente');
      } else {
        console.log('Creando nuevo préstamo');
        const response = await api.createLoan(formData);
        console.log('Respuesta creación:', response);
        showSnackbar('Préstamo creado exitosamente');
      }
      
      fetchLoans();
      handleCloseDialog();
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Error al guardar el préstamo';
      
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
            errorMessage = 'Préstamo no encontrado';
            break;
          case 409:
            errorMessage = 'Conflicto con datos existentes';
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
    const loan = loans.find(l => l.id === id);
    if (window.confirm(`¿Estás seguro de que quieres eliminar el préstamo #${id}?`)) {
      try {
        await api.deleteLoan(id);
        showSnackbar('Préstamo eliminado exitosamente');
        fetchLoans();
      } catch (error) {
        console.error('Error deleting loan:', error);
        const errorMessage = error.response?.data?.message || 'Error al eliminar el préstamo';
        showSnackbar(errorMessage, 'error');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'activo':
        return 'primary';
      case 'devuelto':
        return 'success';
      case 'vencido':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Cargando préstamos...</Typography>
      </Box>
    );
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Préstamos
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Préstamo
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Ejemplar</TableCell>
              <TableCell>Libro</TableCell>
              <TableCell>Bibliotecario</TableCell>
              <TableCell>Fecha Préstamo</TableCell>
              <TableCell>Fecha Devolución</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                    <LibraryBooks sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                    <Typography variant="body2" color="textSecondary">
                      No hay préstamos registrados
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              loans.map((loan) => (
                <TableRow key={loan.id} hover>
                  <TableCell>{loan.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {loan.usuarios?.nombre || `ID: ${loan.usuario_id}`}
                    </Typography>
                  </TableCell>
                  <TableCell>{loan.ejemplar_id}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {loan.ejemplares?.libros?.titulo || 'Sin título'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {loan.bibliotecarios?.nombre || `ID: ${loan.bibliotecario_id}`}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(loan.fecha_prestamo)}</TableCell>
                  <TableCell>{formatDate(loan.fecha_devolucion)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={loan.estado} 
                      color={getStatusColor(loan.estado)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenDialog(loan)}
                      size="small"
                      title="Editar préstamo"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(loan.id)}
                      size="small"
                      title="Eliminar préstamo"
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

      {/* Dialog para crear/editar préstamo */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingLoan ? 'Editar Préstamo' : 'Nuevo Préstamo'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth required error={!!errors.usuario_id}>
              <InputLabel>Usuario</InputLabel>
              <Select
                name="usuario_id"
                value={formData.usuario_id}
                onChange={handleInputChange}
                label="Usuario"
              >
                {usuarios.map((usuario) => (
                  <MenuItem key={usuario.id} value={usuario.id}>
                    {usuario.nombre} - {usuario.email}
                  </MenuItem>
                ))}
              </Select>
              {errors.usuario_id && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.usuario_id}
                </Typography>
              )}
            </FormControl>
            
            <FormControl fullWidth required error={!!errors.ejemplar_id}>
              <InputLabel>Ejemplar</InputLabel>
              <Select
                name="ejemplar_id"
                value={formData.ejemplar_id}
                onChange={handleInputChange}
                label="Ejemplar"
              >
                {ejemplares.map((ejemplar) => (
                  <MenuItem key={ejemplar.id} value={ejemplar.id}>
                    #{ejemplar.id} - {ejemplar.libros?.titulo || ejemplar.libro_id}
                  </MenuItem>
                ))}
              </Select>
              {errors.ejemplar_id && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.ejemplar_id}
                </Typography>
              )}
            </FormControl>
            
            <FormControl fullWidth required error={!!errors.bibliotecario_id}>
              <InputLabel>Bibliotecario</InputLabel>
              <Select
                name="bibliotecario_id"
                value={formData.bibliotecario_id}
                onChange={handleInputChange}
                label="Bibliotecario"
              >
                {bibliotecarios.map((bibliotecario) => (
                  <MenuItem key={bibliotecario.id} value={bibliotecario.id}>
                    {bibliotecario.nombre}
                  </MenuItem>
                ))}
              </Select>
              {errors.bibliotecario_id && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.bibliotecario_id}
                </Typography>
              )}
            </FormControl>
            
            <TextField
              name="fecha_devolucion"
              label="Fecha de Devolución"
              type="date"
              value={formData.fecha_devolucion}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              error={!!errors.fecha_devolucion}
              helperText={errors.fecha_devolucion || "Por defecto: 2 semanas desde hoy"}
            />
            
            {editingLoan && (
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  label="Estado"
                >
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="devuelto">Devuelto</MenuItem>
                  <MenuItem value="atrasado">Atrasado</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingLoan ? 'Actualizar' : 'Crear'}
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

export default Loans;
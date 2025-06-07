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
  IconButton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { api } from '../services/api';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    editorial: '',
    isbn: '',
    anio_publicacion: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await api.getBooks();
      setBooks(response.data);
    } catch (error) {
      showSnackbar('Error al cargar los libros', 'error');
    }
  };

  const handleOpenDialog = (book = null) => {
    if (book) {
      setFormData({
        titulo: book.titulo,
        autor: book.autor,
        editorial: book.editorial,
        isbn: book.isbn,
        anio_publicacion: book.a_o_publicacion
      });
      setEditMode(true);
      setSelectedBook(book);
    } else {
      setFormData({
        titulo: '',
        autor: '',
        editorial: '',
        isbn: '',
        anio_publicacion: ''
      });
      setEditMode(false);
      setSelectedBook(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      titulo: '',
      autor: '',
      editorial: '',
      isbn: '',
      anio_publicacion: ''
    });
    setEditMode(false);
    setSelectedBook(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.titulo || !formData.autor) {
      showSnackbar('El título y autor son campos requeridos', 'error');
      return;
    }

    try {
      // Convert año_publicacion to number or null
      const dataToSend = {
        ...formData,
        anio_publicacion: formData.anio_publicacion ? parseInt(formData.anio_publicacion) : null
      };

      if (editMode) {
        await api.updateBook(selectedBook.id, dataToSend);
        showSnackbar('Libro actualizado exitosamente');
      } else {
        await api.createBook(dataToSend);
        showSnackbar('Libro creado exitosamente');
      }
      handleCloseDialog();
      fetchBooks();
    } catch (error) {
      const errorMessage = error.response?.data?.details || error.message;
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDelete = async (book) => {
    try {
      await api.deleteBook(book.id);
      showSnackbar('Libro eliminado exitosamente');
      fetchBooks();
      setOpenDeleteDialog(false);
    } catch (error) {
      let errorMessage = 'No se puede eliminar el libro';
      
      // Si el error viene del backend con detalles específicos
      if (error.response?.data?.details) {
        if (error.response.data.details.includes('Foreign key constraint')) {
          errorMessage = 'No se puede eliminar el libro porque está siendo utilizado en el sistema. Asegúrate de que no tenga préstamos, reservas u otras relaciones activas.';
        } else {
          errorMessage = error.response.data.details;
        }
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet.';
      }
      
      showSnackbar(errorMessage, 'error');
      setOpenDeleteDialog(false);
    }
  };

  const handleConfirmDelete = (book) => {
    setSelectedBook(book);
    setOpenDeleteDialog(true);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Libros
      </Typography>

      <Button
        variant="contained"
        color="primary"
        sx={{ mb: 2 }}
        onClick={() => handleOpenDialog()}
      >
        Agregar Libro
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Autor</TableCell>
              <TableCell>Editorial</TableCell>
              <TableCell>ISBN</TableCell>
              <TableCell>Año</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book.id}>
                <TableCell>{book.id}</TableCell>
                <TableCell>{book.titulo}</TableCell>
                <TableCell>{book.autor}</TableCell>
                <TableCell>{book.editorial}</TableCell>
                <TableCell>{book.isbn}</TableCell>
                <TableCell>{book.a_o_publicacion}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpenDialog(book)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleConfirmDelete(book)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para Crear/Editar Libro */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Editar Libro' : 'Agregar Libro'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Título"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Autor"
                value={formData.autor}
                onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Editorial"
                value={formData.editorial}
                onChange={(e) => setFormData({ ...formData, editorial: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="ISBN"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Año de Publicación"
                type="number"
                value={formData.anio_publicacion}
                onChange={(e) => setFormData({ ...formData, anio_publicacion: e.target.value })}
                required
                fullWidth
                InputProps={{ inputProps: { min: 1000, max: new Date().getFullYear() } }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary">
              {editMode ? 'Guardar' : 'Agregar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el libro "{selectedBook?.titulo}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Nota: No se podrá eliminar el libro si tiene préstamos activos, reservas u otras relaciones en el sistema.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button
            onClick={() => handleDelete(selectedBook)}
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Books;

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
  Typography
} from '@mui/material';
import { api } from '../services/api';

const Loans = () => {
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await api.getLoans();
      setLoans(response.data);
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Préstamos
      </Typography>
      
      <Button 
        variant="contained" 
        color="primary" 
        sx={{ mb: 2 }}
      >
        Nuevo Préstamo
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Libro</TableCell>
              <TableCell>Fecha Préstamo</TableCell>
              <TableCell>Fecha Devolución</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loans.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell>{loan.id}</TableCell>
                <TableCell>{loan.usuario_id}</TableCell>
                <TableCell>{loan.ejemplar_id}</TableCell>
                <TableCell>{new Date(loan.fecha_prestamo).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(loan.fecha_devolucion).toLocaleDateString()}</TableCell>
                <TableCell>{loan.estado}</TableCell>
                <TableCell>
                  <Button color="primary">Editar</Button>
                  <Button color="error">Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default Loans;

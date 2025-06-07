const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Crear un nuevo préstamo
const createLoan = async (req, res) => {
    try {
        const { usuario_id, ejemplar_id, bibliotecario_id, fecha_devolucion } = req.body;
        
        // Verificar si el ejemplar está disponible
        const ejemplar = await prisma.ejemplares.findUnique({
            where: { id: ejemplar_id }
        });
        
        if (!ejemplar || ejemplar.estado !== 'disponible') {
            return res.status(400).json({ error: 'El ejemplar no está disponible para préstamo' });
        }
        
        // Crear el préstamo
        const loan = await prisma.prestamos.create({
            data: {
                usuario_id,
                ejemplar_id,
                bibliotecario_id,
                fecha_devolucion: new Date(fecha_devolucion),
                estado: 'activo'
            },
            include: {
                usuarios: true,
                ejemplares: {
                    include: {
                        libros: true
                    }
                },
                bibliotecarios: true
            }
        });
        
        // Actualizar el estado del ejemplar
        await prisma.ejemplares.update({
            where: { id: ejemplar_id },
            data: { estado: 'prestado' }
        });
        
        res.status(201).json(loan);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el préstamo', details: error.message });
    }
};

// Obtener todos los préstamos
const getAllLoans = async (req, res) => {
    try {
        const loans = await prisma.prestamos.findMany({
            include: {
                usuarios: true,
                ejemplares: {
                    include: {
                        libros: true
                    }
                },
                bibliotecarios: true
            }
        });
        res.json(loans);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los préstamos', details: error.message });
    }
};

// Obtener un préstamo por ID
const getLoanById = async (req, res) => {
    try {
        const { id } = req.params;
        const loan = await prisma.prestamos.findUnique({
            where: { id: parseInt(id) },
            include: {
                usuarios: true,
                ejemplares: {
                    include: {
                        libros: true
                    }
                },
                bibliotecarios: true
            }
        });
        
        if (!loan) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }
        
        res.json(loan);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el préstamo', details: error.message });
    }
};

// Actualizar un préstamo
const updateLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, fecha_devolucion } = req.body;
        
        const updatedLoan = await prisma.prestamos.update({
            where: { id: parseInt(id) },
            data: {
                estado,
                fecha_devolucion: fecha_devolucion ? new Date(fecha_devolucion) : undefined
            },
            include: {
                usuarios: true,
                ejemplares: {
                    include: {
                        libros: true
                    }
                },
                bibliotecarios: true
            }
        });
        
        // Si el préstamo se marca como devuelto, actualizar el estado del ejemplar
        if (estado === 'devuelto') {
            await prisma.ejemplares.update({
                where: { id: updatedLoan.ejemplar_id },
                data: { estado: 'disponible' }
            });
        }
        
        res.json(updatedLoan);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el préstamo', details: error.message });
    }
};

// Eliminar un préstamo
const deleteLoan = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Obtener el préstamo antes de eliminarlo
        const loan = await prisma.prestamos.findUnique({
            where: { id: parseInt(id) }
        });
        
        if (!loan) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }
        
        // Eliminar el préstamo
        await prisma.prestamos.delete({
            where: { id: parseInt(id) }
        });
        
        // Actualizar el estado del ejemplar a disponible
        await prisma.ejemplares.update({
            where: { id: loan.ejemplar_id },
            data: { estado: 'disponible' }
        });
        
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el préstamo', details: error.message });
    }
};

module.exports = {
    createLoan,
    getAllLoans,
    getLoanById,
    updateLoan,
    deleteLoan
}; 
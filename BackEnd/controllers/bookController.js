const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Crear un nuevo libro
const createBook = async (req, res) => {
    try {
        const { titulo, autor, editorial, isbn, anio_publicacion } = req.body;
        
        // Validate required fields
        if (!titulo || !autor) {
            return res.status(400).json({ 
                error: 'Datos incompletos', 
                details: 'El título y autor son campos requeridos' 
            });
        }

        // Crear el libro y su ejemplar en una transacción
        const result = await prisma.$transaction(async (tx) => {
            // 1. Crear el libro
            const book = await tx.libros.create({
                data: {
                    titulo,
                    autor,
                    editorial,
                    isbn,
                    a_o_publicacion: anio_publicacion ? parseInt(anio_publicacion) : null
                }
            });

            // 2. Obtener la primera sala disponible
            const sala = await tx.salas.findFirst();
            if (!sala) {
                throw new Error('No hay salas disponibles para asignar el ejemplar');
            }

            // 3. Crear un ejemplar para el libro
            const ejemplar = await tx.ejemplares.create({
                data: {
                    libro_id: book.id,
                    sala_id: sala.id,
                    estado: 'disponible'
                }
            });

            // 4. Crear registro de inventario para el ejemplar
            await tx.inventarios.create({
                data: {
                    ejemplar_id: ejemplar.id,
                    cantidad: 1,
                    fecha_actualizacion: new Date()
                }
            });

            return book;
        });
        
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al crear libro:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ 
                error: 'ISBN duplicado', 
                details: 'Ya existe un libro con este ISBN' 
            });
        }
        res.status(500).json({ 
            error: 'Error al crear el libro', 
            details: error.message,
            code: error.code 
        });
    }
};

// Obtener todos los libros
const getAllBooks = async (req, res) => {
    try {
        const books = await prisma.libros.findMany({
            include: {
                libros_categorias: {
                    include: {
                        categorias: true
                    }
                }
            }
        });
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los libros', details: error.message });
    }
};

// Obtener un libro por ID
const getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        const book = await prisma.libros.findUnique({
            where: { id: parseInt(id) },
            include: {
                libros_categorias: {
                    include: {
                        categorias: true
                    }
                }
            }
        });
        
        if (!book) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }
        
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el libro', details: error.message });
    }
};

// Actualizar un libro
const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, autor, editorial, isbn, año_publicacion } = req.body;
        
        const updatedBook = await prisma.libros.update({
            where: { id: parseInt(id) },
            data: {
                titulo,
                autor,
                editorial,
                isbn,
                a_o_publicacion: año_publicacion
            }
        });
        
        res.json(updatedBook);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el libro', details: error.message });
    }
};

// Eliminar un libro
const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('ID recibido:', id, typeof id);
        
        const bookId = Number(id);
        if (isNaN(bookId)) {
            return res.status(400).json({
                error: 'ID inválido',
                details: 'El ID debe ser un número'
            });
        }

        // Primero verificamos si el libro existe y obtenemos todas sus relaciones
        const book = await prisma.libros.findFirst({
            where: { id: bookId },
            include: {
                ejemplares: {
                    include: {
                        inventarios: true,
                        prestamos: true,
                        reservas: true,
                        historial_prestamos: true,
                        historial_reservas: true
                    }
                },
                libros_categorias: true,
                proveedores_libros: true,
                compras: true
            }
        });

        if (!book) {
            return res.status(404).json({
                error: 'Libro no encontrado',
                details: `No se encontró un libro con el ID ${bookId}`
            });
        }

        // Verificar si hay préstamos o reservas activas
        const tienePrestamoActivo = book.ejemplares.some(e => 
            e.prestamos.some(p => ['pendiente', 'activo'].includes(p.estado))
        );
        
        const tieneReservaActiva = book.ejemplares.some(e => 
            e.reservas.some(r => ['pendiente', 'confirmada'].includes(r.estado))
        );

        if (tienePrestamoActivo || tieneReservaActiva) {
            return res.status(400).json({
                error: 'No se puede eliminar el libro',
                details: 'El libro tiene préstamos o reservas activas'
            });
        }

        // Si llegamos aquí, podemos proceder con la eliminación
        await prisma.$transaction(async (tx) => {
            // 1. Eliminar historiales
            for (const ejemplar of book.ejemplares) {
                // Eliminar historial de préstamos
                await tx.historial_prestamos.deleteMany({
                    where: { ejemplar_id: ejemplar.id }
                });
                
                // Eliminar historial de reservas
                await tx.historial_reservas.deleteMany({
                    where: { ejemplar_id: ejemplar.id }
                });
            }

            // 2. Eliminar inventarios
            await tx.inventarios.deleteMany({
                where: {
                    ejemplar_id: {
                        in: book.ejemplares.map(e => e.id)
                    }
                }
            });

            // 3. Eliminar ejemplares
            await tx.ejemplares.deleteMany({
                where: { libro_id: bookId }
            });

            // 4. Eliminar relaciones con categorías
            await tx.libros_categorias.deleteMany({
                where: { libro_id: bookId }
            });

            // 5. Eliminar relaciones con proveedores
            await tx.proveedores_libros.deleteMany({
                where: { libro_id: bookId }
            });

            // 6. Eliminar compras
            await tx.compras.deleteMany({
                where: { libro_id: bookId }
            });

            // 7. Finalmente, eliminar el libro
            await tx.libros.delete({
                where: { id: bookId }
            });
        });

        res.json({ 
            message: 'Libro eliminado exitosamente',
            id: bookId
        });
    } catch (error) {
        console.error('Error detallado al eliminar libro:', error);
        
        // Manejar diferentes tipos de errores de Prisma
        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'Registro no encontrado',
                details: 'No se pudo encontrar el libro para eliminar'
            });
        }
        
        if (error.code === 'P2003') {
            return res.status(400).json({
                error: 'Error de restricción',
                details: 'No se puede eliminar el libro porque tiene registros relacionados que deben eliminarse primero'
            });
        }

        res.status(500).json({
            error: 'Error al eliminar el libro',
            details: error.message,
            code: error.code
        });
    }
};

module.exports = {
    createBook,
    getAllBooks,
    getBookById,
    updateBook,
    deleteBook
};
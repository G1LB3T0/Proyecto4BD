const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Crear un nuevo libro
const createBook = async (req, res) => {
    try {
        const { titulo, autor, editorial, isbn, año_publicacion } = req.body;
        
        const book = await prisma.libros.create({
            data: {
                titulo,
                autor,
                editorial,
                isbn,
                a_o_publicacion: año_publicacion
            }
        });
        
        res.status(201).json(book);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el libro', details: error.message });
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
        
        await prisma.libros.delete({
            where: { id: parseInt(id) }
        });
        
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el libro', details: error.message });
    }
};

module.exports = {
    createBook,
    getAllBooks,
    getBookById,
    updateBook,
    deleteBook
};
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Crear un nuevo usuario
const createUser = async (req, res) => {
    try {
        const { nombre, direccion, telefono, email, roles } = req.body;
        
        const user = await prisma.usuarios.create({
            data: {
                nombre,
                direccion,
                telefono,
                email,
                usuarios_roles: {
                    create: roles.map(rolId => ({
                        roles: {
                            connect: { id: rolId }
                        }
                    }))
                }
            },
            include: {
                usuarios_roles: {
                    include: {
                        roles: true
                    }
                }
            }
        });
        
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el usuario', details: error.message });
    }
};

// Obtener todos los usuarios
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.usuarios.findMany({
            include: {
                usuarios_roles: {
                    include: {
                        roles: true
                    }
                }
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los usuarios', details: error.message });
    }
};

// Obtener un usuario por ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.usuarios.findUnique({
            where: { id: parseInt(id) },
            include: {
                usuarios_roles: {
                    include: {
                        roles: true
                    }
                }
            }
        });
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el usuario', details: error.message });
    }
};

// Actualizar un usuario
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, direccion, telefono, email, roles } = req.body;
        
        // Primero actualizamos los datos básicos del usuario
        const updatedUser = await prisma.usuarios.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                direccion,
                telefono,
                email,
                usuarios_roles: {
                    deleteMany: {},
                    create: roles.map(rolId => ({
                        roles: {
                            connect: { id: rolId }
                        }
                    }))
                }
            },
            include: {
                usuarios_roles: {
                    include: {
                        roles: true
                    }
                }
            }
        });
        
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el usuario', details: error.message });
    }
};

// Eliminar un usuario
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        await prisma.usuarios.delete({
            where: { id: parseInt(id) }
        });
        
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el usuario', details: error.message });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
}; 
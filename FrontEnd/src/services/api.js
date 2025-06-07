import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const api = {
    // Libros
    getBooks: () => axios.get(`${API_URL}/books`),
    getBookById: (id) => axios.get(`${API_URL}/books/${id}`),
    createBook: (book) => axios.post(`${API_URL}/books`, book),
    updateBook: (id, book) => axios.put(`${API_URL}/books/${id}`, book),
    deleteBook: (id) => axios.delete(`${API_URL}/books/${id}`),

    // Usuarios
    getUsers: () => axios.get(`${API_URL}/users`),
    getUserById: (id) => axios.get(`${API_URL}/users/${id}`),
    createUser: (user) => axios.post(`${API_URL}/users`, user),
    updateUser: (id, user) => axios.put(`${API_URL}/users/${id}`, user),
    deleteUser: (id) => axios.delete(`${API_URL}/users/${id}`),

    // Préstamos
    getLoans: () => axios.get(`${API_URL}/loans`),
    getLoanById: (id) => axios.get(`${API_URL}/loans/${id}`),
    createLoan: (loan) => axios.post(`${API_URL}/loans`, loan),
    updateLoan: (id, loan) => axios.put(`${API_URL}/loans/${id}`, loan),
    deleteLoan: (id) => axios.delete(`${API_URL}/loans/${id}`),
};

const express = require('express');
const router = express.Router();
const { getCategoriesHierarchy, getCategoryById, createCategory, deleteCategoryById, updateCategory } = require('../categoryController');

// Ruta para obtener la jerarquía de categorías
router.get('/categories', getCategoriesHierarchy);

// Ruta para obtener una categoría por ID
router.get('/categories/:id', getCategoryById);

// Ruta para crear una nueva categoría
router.post('/categories', createCategory);

router.put('/categories/:id', updateCategory); // Nueva ruta

// Ruta para eliminar una categoría por ID
router.delete('/categories/:id', deleteCategoryById);

module.exports = router;

const mongoose = require('mongoose');
const { CategorySchema, getCollectionName } = require('./models/Category');

// Función para obtener una categoría con sus subcategorías
const getCategoryHierarchy = async (parentId, CategoryModel) => {
    const categories = await CategoryModel.find({ parent: parentId });

    // Para cada categoría, obtenemos sus subcategorías de manera recursiva
    const categoryHierarchy = await Promise.all(categories.map(async category => {
        const children = await getCategoryHierarchy(category._id, CategoryModel);
        return {
            ...category.toObject(),
            children
        };
    }));

    return categoryHierarchy;
};

// Controlador para el endpoint de jerarquía
const getCategoriesHierarchy = async (req, res) => {
    try {
        const domain = req.headers['domain'];
        if (!domain) {
            return res.status(400).json({ message: 'Domain header is required' });
        }
        const collectionName = getCollectionName(domain);
        const CategoryModel = mongoose.model('Category', CategorySchema, collectionName);

        // Obtener la jerarquía comenzando desde el nivel superior (sin parent)
        const hierarchy = await getCategoryHierarchy(null, CategoryModel);
        res.json(hierarchy);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Controlador para obtener una categoría por ID
const getCategoryById = async (req, res) => {
    try {
        const domain = req.headers['domain'];
        if (!domain) {
            return res.status(400).json({ message: 'Domain header is required' });
        }
        const collectionName = getCollectionName(domain);
        const CategoryModel = mongoose.model('Category', CategorySchema, collectionName);

        const category = await CategoryModel.findById(req.params.id).populate('parent');

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Controlador para crear una nueva categoría
const createCategory = async (req, res) => {
    try {
        const domain = req.headers['domain'];
        if (!domain) {
            return res.status(400).json({ message: 'Domain header is required' });
        }
        const collectionName = getCollectionName(domain);
        const CategoryModel = mongoose.model('Category', CategorySchema, collectionName);

        const category = new CategoryModel(req.body);
        category.domain = domain; // Añadimos el dominio al documento

        const newCategory = await category.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Controlador para eliminar una categoría por ID
const deleteCategoryById = async (req, res) => {
    try {
        const domain = req.headers['domain'];
        if (!domain) {
            return res.status(400).json({ message: 'Domain header is required' });
        }
        const collectionName = getCollectionName(domain);
        const CategoryModel = mongoose.model('Category', CategorySchema, collectionName);

        const category = await CategoryModel.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await category.deleteOne();
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCategoriesHierarchy,
    getCategoryById,
    createCategory,
    deleteCategoryById
};

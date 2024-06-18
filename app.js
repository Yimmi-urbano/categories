const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const slugify = require('slugify');

const app = express();
const PORT = 4000;

app.use(bodyParser.json());
app.use(cors());

// Conexión a MongoDB
mongoose.connect('mongodb+srv://data_user:wY1v50t8fX4lMA85@cluster0.entyyeb.mongodb.net/categories', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Modelo de categoría
const CategorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    icon_url: { type: String },
    slug: { type: String, unique: true }
});

// Middleware para generar y asegurar unicidad del slug antes de guardar
CategorySchema.pre('validate', async function(next) {
    if (this.isModified('title') || this.isNew) {
        const baseSlug = slugify(this.title, { lower: true, strict: true });
        let uniqueSlug = baseSlug;

        const CategoryModel = mongoose.model('Category', CategorySchema, 'categories');

        let slugExists = await CategoryModel.findOne({ slug: uniqueSlug });
        let counter = 2;

        while (slugExists) {
            uniqueSlug = `${baseSlug}-${counter}`;
            slugExists = await CategoryModel.findOne({ slug: uniqueSlug });
            counter++;
        }
        this.slug = uniqueSlug;
    }
    next();
});

// Rutas de la API

// Obtener todas las categorías
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await mongoose.model('Category', CategorySchema, 'categories').find({});
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener una categoría por ID
app.get('/api/categories/:id', async (req, res) => {
    try {
        const category = await mongoose.model('Category', CategorySchema, 'categories').findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Crear una nueva categoría
app.post('/api/categories', async (req, res) => {
    const CategoryModel = mongoose.model('Category', CategorySchema, 'categories');
    const category = new CategoryModel(req.body);

    try {
        const newCategory = await category.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Obtener una categoría por slug
app.get('/api/categories/slug/:slug', async (req, res) => {
    try {
        const category = await mongoose.model('Category', CategorySchema, 'categories').findOne({ slug: req.params.slug });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Eliminar una categoría por ID
app.delete('/api/categories/:id', async (req, res) => {
    try {
        const category = await mongoose.model('Category', CategorySchema, 'categories').findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await category.deleteOne();
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Middleware para manejar errores 404
app.use((req, res, next) => {
    res.status(404).json({ message: 'Not found' });
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

// Escuchar en el puerto especificado
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const mongoose = require('mongoose');
const slugify = require('slugify');

// Define el esquema de la categoría
const CategorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    icon_url: { type: String },
    slug: { type: String, unique: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // Referencia a la categoría padre
    productCount: { type: Number, default: 0 } // Cantidad de productos en esta categoría
});

// Middleware para generar y asegurar unicidad del slug antes de guardar
CategorySchema.pre('validate', async function(next) {
    if (this.isModified('title') || this.isNew) {
        const baseSlug = slugify(this.title, { lower: true, strict: true });
        let uniqueSlug = baseSlug;

        const domain = this.domain; // El dominio se pasará como parte del documento
        const collectionName = getCollectionName(domain);
        const CategoryModel = mongoose.model('Category', CategorySchema, collectionName);

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

// Función para obtener el nombre de la colección basado en el dominio
function getCollectionName(domain) {
    return `categories-${domain}`;
}

module.exports = {
    CategorySchema,
    getCollectionName
};

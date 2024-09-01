const mongoose = require('mongoose');
const { getCollectionName } = require('../models/Category');

// Actualizar contador de productos en la categoría
async function updateCategoryProductCount(domain,categoryId, increment = true) {
    const domainPrimary = domain; // Define tu dominio o pásalo como parámetro
    const collectionName = getCollectionName(domainPrimary);
    const CategoryModel = mongoose.model('Category', CategorySchema, collectionName);

    const update = increment ? { $inc: { productCount: 1 } } : { $inc: { productCount: -1 } };

    await CategoryModel.findByIdAndUpdate(categoryId, update);
}

module.exports = { updateCategoryProductCount };

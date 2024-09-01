const slugify = require('slugify');

// Función para generar un slug único
function generateUniqueSlug(title, model) {
    const baseSlug = slugify(title, { lower: true, strict: true });
    let uniqueSlug = baseSlug;
    let counter = 2;

    return model.findOne({ slug: uniqueSlug })
        .then((doc) => {
            while (doc) {
                uniqueSlug = `${baseSlug}-${counter}`;
                counter++;
                return model.findOne({ slug: uniqueSlug });
            }
            return uniqueSlug;
        });
}

module.exports = {
    generateUniqueSlug
};

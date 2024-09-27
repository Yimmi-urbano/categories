const mongoose = require('mongoose');
const slugify = require('slugify');

// Define the category schema with a domain and an array of categories
const CategorySchema = new mongoose.Schema({
    domain: { type: String, required: true, unique: true },
    categories: [
        {
            title: { type: String, required: true },
            icon_url: { type: String },
            slug: { type: String, unique: true },
            parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Categories', default: null }, // Reference to the parent category
            productCount: { type: Number, default: 0 } // Number of products in this category
        }
    ]
});

// Middleware to generate and ensure uniqueness of the slug in categories before saving
CategorySchema.pre('validate', async function (next) {
    const categoryPromises = this.categories.map(async (category) => {
        const baseSlug = slugify(category.title, { lower: true, strict: true });
        let uniqueSlug = baseSlug;
        let counter = 1;

        // Check if the slug already exists in the database
        let existingCategory = await this.constructor.findOne({
            domain: this.domain,
            'categories.slug': uniqueSlug
        });

        // Increment slug if it already exists
        while (existingCategory) {
            uniqueSlug = `${baseSlug}-${counter}`;
            existingCategory = await this.constructor.findOne({
                domain: this.domain,
                'categories.slug': uniqueSlug
            });
            counter++;
        }

        // Assign the unique slug to the category
        category.slug = uniqueSlug;
    });

    // Wait for all slug generation to complete
    await Promise.all(categoryPromises);
    next();
});

module.exports = mongoose.model('Categories', CategorySchema);

const mongoose = require('mongoose');
const slugify = require('slugify');  // Ensure slugify is required
const { CategorySchema } = require('./models/Category');

// Define a fixed model for the Category collection
const CategoryModel = mongoose.model('Categories', CategorySchema, 'categories');

// Controller to get the category hierarchy
const getCategoriesHierarchy = async (req, res) => {
    try {
        const domain = req.headers['domain'];
        if (!domain) {
            return res.status(400).json({ message: 'Domain header is required' });
        }

        // Find the category document for the given domain
        const categoryDoc = await CategoryModel.findOne({ domain });

        if (!categoryDoc) {
            return res.status(404).json({ message: 'No categories found for this domain' });
        }

        const categories = categoryDoc.categories;

        // Build the hierarchy based on the parent-child relationship
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat._id] = { ...cat.toObject(), children: [] };
        });

        const categoryHierarchy = [];
        categories.forEach(category => {
            if (category.parent === null) {
                categoryHierarchy.push(categoryMap[category._id]);
            } else if (category.parent && categoryMap[category.parent]) {
                categoryMap[category.parent].children.push(categoryMap[category._id]);
            }
        });

        res.json(categoryHierarchy); // Send the hierarchical categories as a response
    } catch (error) {
        console.error('Error fetching category hierarchy:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Controller to get a category by ID
const getCategoryById = async (req, res) => {
    try {
        const domain = req.headers['domain'];
        if (!domain) {
            return res.status(400).json({ message: 'Domain header is required' });
        }

        const categoryDoc = await CategoryModel.findOne({ 'categories._id': req.params.id, domain });

        if (!categoryDoc) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Find the specific category from the categories array
        const foundCategory = categoryDoc.categories.id(req.params.id);
        res.json(foundCategory);
    } catch (error) {
        console.error('Error fetching category by ID:', error);
        res.status(500).json({ message: error.message });
    }
};

// Controller to create a new category
const createCategory = async (req, res) => {
    try {
        const domain = req.headers['domain'];
        if (!domain) {
            return res.status(400).json({ message: 'Domain header is required' });
        }

        const { title, icon_url, parent, productCount = 0 } = req.body;
        
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        // Generate the base slug from the title
        const baseSlug = slugify(title, { lower: true, strict: true });
        let uniqueSlug = baseSlug;
        let counter = 1;

        // Check for existing slugs in the same domain
        let existingCategory = await CategoryModel.findOne({
            domain,
            'categories.slug': uniqueSlug
        });

        // Increment slug if it already exists
        while (existingCategory) {
            uniqueSlug = `${baseSlug}-${counter}`;
            existingCategory = await CategoryModel.findOne({
                domain,
                'categories.slug': uniqueSlug
            });
            counter++;
        }

        // Create the new category object
        const newCategory = {
            title,
            icon_url,
            slug: uniqueSlug,  // Use the generated unique slug
            parent: parent || null,
            productCount
        };

        // Update the Category collection
        const category = await CategoryModel.findOneAndUpdate(
            { domain },
            { $push: { categories: newCategory } },
            { new: true, upsert: true }
        );

        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(400).json({ message: error.message });
    }
};

// Controller to delete a category by ID
const deleteCategoryById = async (req, res) => {
    try {
        const domain = req.headers['domain'];
        if (!domain) {
            return res.status(400).json({ message: 'Domain header is required' });
        }

        const category = await CategoryModel.findOneAndUpdate(
            { domain },
            { $pull: { categories: { _id: req.params.id } } },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: error.message });
    }
};

// Controller to update a category by ID
const updateCategory = async (req, res) => {
    try {
        const domain = req.headers['domain'];
        if (!domain) {
            return res.status(400).json({ message: 'Domain header is required' });
        }

        const updatedCategory = await CategoryModel.findOneAndUpdate(
            { domain, 'categories._id': req.params.id },
            { $set: { 'categories.$': req.body } },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(updatedCategory);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCategoriesHierarchy,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategoryById
};

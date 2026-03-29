const Category = require("../models/Category");
const slugify = require("slugify");

exports.createCategory = async (req, res) => {
  try {
    const { name, parentId, icon } = req.body;

    const category = await Category.create({
      name,
      slug: slugify(name, { lower: true }),
      parentId: parentId || null,
      icon,
    });

    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCategories = async (req, res) => {
  const categories = await Category.find().populate("parentId");
  res.json({
    success: true,
    data: categories,
  });
 // res.json(categories);
};

exports.updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(category);
};

exports.deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
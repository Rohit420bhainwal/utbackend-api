const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    icon: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
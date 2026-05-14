const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Calculus',
        'Linear Algebra',
        'Differential Equations',
        'Real Analysis',
        'Complex Analysis',
        'Numerical Methods',
        'Abstract Algebra',
        'Topology',
        'Statistics',
        'Probability',
        'Discrete Mathematics',
        'Number Theory',
        'Other'
      ]
    },
    thumbnail: {
      type: String,
      default: ''
    },
    thumbnailPublicId: {
      type: String,
      default: ''
    },
    pdfLink: {
      type: String,
      default: ''
    },
    edition: {
      type: String,
      default: ''
    },
    publisher: {
      type: String,
      default: ''
    },
    year: {
      type: Number
    },
    tags: [{ type: String }],
    isPublished: {
      type: Boolean,
      default: true
    },
    downloads: {
      type: Number,
      default: 0
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual: chapter count
bookSchema.virtual('chapters', {
  ref: 'Chapter',
  localField: '_id',
  foreignField: 'book',
  count: true
});

// Full text search index
bookSchema.index({ title: 'text', author: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Book', bookSchema);

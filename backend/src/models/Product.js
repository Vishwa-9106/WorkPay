const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  workerSalary: {
    type: Number,
    required: [true, 'Worker salary is required'],
    min: [0, 'Salary cannot be negative']
  },
  ownerSalary: {
    type: Number,
    required: false,
    default: null,
    min: [0, 'Salary cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

productSchema.index({ name: 1 }, { unique: true });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);

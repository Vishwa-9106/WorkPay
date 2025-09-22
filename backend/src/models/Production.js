const mongoose = require('mongoose');

const productionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Production date is required'],
    default: Date.now
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: [true, 'Worker is required']
  },
  machineNumber: {
    type: String,
    required: [true, 'Machine number is required'],
    trim: true,
    maxlength: [50, 'Machine number cannot exceed 50 characters']
  },
  quantityProduced: {
    type: Number,
    required: [true, 'Quantity produced is required'],
    min: [0, 'Quantity cannot be negative']
  },
  productType: {
    type: String,
    trim: true,
    maxlength: [100, 'Product type cannot exceed 100 characters']
  },
  shift: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Night'],
    default: 'Morning'
  },
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'Rejected'],
    default: 'A'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  wastage: {
    type: Number,
    min: [0, 'Wastage cannot be negative'],
    default: 0
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
productionSchema.index({ date: -1 });
productionSchema.index({ worker: 1 });
productionSchema.index({ machineNumber: 1 });
productionSchema.index({ shift: 1 });

module.exports = mongoose.model('Production', productionSchema);
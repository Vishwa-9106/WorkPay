const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Worker name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\+?[\d\s-()]{10,}$/, 'Please enter a valid phone number']
  },
  // Power loom number assignment (1, 2, or 3)
  powerLoomNumber: {
    type: Number,
    enum: [1, 2, 3],
    default: 1
  },
  // Role of the worker within the factory
  role: {
    type: String,
    enum: ['Loom Operator', 'Mechanic', 'Loader'],
    default: 'Loom Operator',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
workerSchema.index({ name: 1 });
workerSchema.index({ isActive: 1 });
workerSchema.index({ powerLoomNumber: 1 });
workerSchema.index({ role: 1 });

module.exports = mongoose.model('Worker', workerSchema);
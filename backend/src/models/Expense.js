const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseType: {
    type: String,
    required: [true, 'Expense type is required'],
    trim: true,
    enum: {
      values: ['Raw Materials', 'Equipment', 'Utilities', 'Labor', 'Maintenance', 'Transport', 'Office Supplies', 'Salary', 'Other'],
      message: 'Please select a valid expense type'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: ['Fixed', 'Variable', 'One-time'],
    default: 'Variable'
  },
  receipt: {
    type: String, // Will store file path or URL when file upload is implemented
    default: null
  },
  isApproved: {
    type: Boolean,
    default: true // For future approval workflow
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
expenseSchema.index({ date: -1 });
expenseSchema.index({ expenseType: 1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
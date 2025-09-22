const mongoose = require('mongoose');

const machineEntrySchema = new mongoose.Schema({
  index: { type: Number, required: true, min: 1, max: 9 },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: [0, 'Quantity cannot be negative'] },
}, { _id: false });

const powerloomProductionSchema = new mongoose.Schema({
  loomNumber: { type: Number, enum: [1, 2, 3], required: true },
  date: { type: Date, required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  machines: { type: [machineEntrySchema], default: [] },
}, { timestamps: true });

powerloomProductionSchema.index({ loomNumber: 1, date: -1 });
powerloomProductionSchema.index({ worker: 1 });

module.exports = mongoose.model('PowerloomProduction', powerloomProductionSchema);

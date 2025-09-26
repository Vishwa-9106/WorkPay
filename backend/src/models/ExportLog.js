const mongoose = require('mongoose');

const exportLogSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true, index: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  salary: { type: Number, required: true, min: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ExportLog', exportLogSchema);

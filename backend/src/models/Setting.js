const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    valueNumber: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);

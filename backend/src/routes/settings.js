const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');

// GET /api/settings/revenue -> { success, data: { value: number } }
router.get('/revenue', async (req, res) => {
  try {
    const doc = await Setting.findOne({ key: 'totalRevenue' });
    const value = doc?.valueNumber ?? 0;
    res.json({ success: true, data: { value } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch revenue', message: error.message });
  }
});

// PUT /api/settings/revenue { value: number }
router.put('/revenue', async (req, res) => {
  try {
    let { value } = req.body || {};
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return res.status(400).json({ success: false, error: 'Invalid value', message: 'Value must be a non-negative number' });
    }
    const updated = await Setting.findOneAndUpdate(
      { key: 'totalRevenue' },
      { $set: { valueNumber: value } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: { value: updated.valueNumber } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update revenue', message: error.message });
  }
});

module.exports = router;

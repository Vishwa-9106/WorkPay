const express = require('express');
const router = express.Router();
const PowerloomProduction = require('../models/PowerloomProduction');
const mongoose = require('mongoose');

// GET /api/powerloom-production?loom=1 - list by loom
router.get('/', async (req, res) => {
  try {
    const loom = parseInt(req.query.loom, 10);
    const query = {};
    if ([1, 2, 3].includes(loom)) query.loomNumber = loom;
    const productions = await PowerloomProduction.find(query)
      .populate('worker', 'name')
      .populate('machines.product', 'name')
      .sort({ date: 1, createdAt: 1 });
    res.json({ success: true, data: productions, count: productions.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
});

// POST /api/powerloom-production - create
router.post('/', async (req, res) => {
  try {
    const { loomNumber, date, worker, machines } = req.body;
    // Log incoming payload for debugging
    console.log('POST /api/powerloom-production payload:', JSON.stringify(req.body));
    if (![1, 2, 3].includes(loomNumber)) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'Invalid loom number' });
    }
    if (!date || !worker) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'Date and worker are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(worker)) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'Invalid worker id' });
    }
    if (!Array.isArray(machines) || machines.length === 0) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'At least one machine entry is required' });
    }
    // Basic validation for machines entries
    const maxByLoom = { 1: 8, 2: 9, 3: 5 };
    const maxIndex = maxByLoom[loomNumber];
    for (const m of machines) {
      if (typeof m.index !== 'number' || m.index < 1 || m.index > maxIndex) {
        return res.status(400).json({ success: false, error: 'Validation Error', message: `Machine index must be between 1 and ${maxIndex} for loom ${loomNumber}` });
      }
      if (!m.product) {
        return res.status(400).json({ success: false, error: 'Validation Error', message: 'Product is required for each machine entry' });
      }
      if (!mongoose.Types.ObjectId.isValid(m.product)) {
        return res.status(400).json({ success: false, error: 'Validation Error', message: `Invalid product id for machine ${m.index}` });
      }
      if (typeof m.quantity !== 'number' || m.quantity < 0) {
        return res.status(400).json({ success: false, error: 'Validation Error', message: 'Quantity must be a non-negative number' });
      }
    }

    // Ensure date is a valid Date instance
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'Invalid date format' });
    }

    const created = await PowerloomProduction.create({ loomNumber, date: parsedDate, worker, machines });
    // Populate using findById for compatibility
    const populated = await PowerloomProduction.findById(created._id)
      .populate('worker', 'name')
      .populate('machines.product', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Error in POST /api/powerloom-production:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'Invalid id format' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: 'Validation Error', message: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
});

module.exports = router;

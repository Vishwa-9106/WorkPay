const express = require('express');
const router = express.Router();
const ExportLog = require('../models/ExportLog');
const Worker = require('../models/Worker');

// POST /api/export-logs
router.post('/', async (req, res) => {
  try {
    const { workerId, fromDate, toDate, salary } = req.body;
    if (!workerId || !fromDate || !toDate || typeof salary !== 'number') {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'workerId, fromDate, toDate, salary are required' });
    }
    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });

    const log = await ExportLog.create({ worker: workerId, fromDate, toDate, salary });
    const populated = await log.populate('worker', 'name role');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    const status = error.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ success: false, error: error.name || 'Server Error', message: error.message });
  }
});

// GET /api/export-logs?workerId=<id>
router.get('/', async (req, res) => {
  try {
    const { workerId } = req.query;
    const query = {};
    if (workerId) query.worker = workerId;
    const logs = await ExportLog.find(query).populate('worker', 'name role').sort({ createdAt: 1 });
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
});

module.exports = router;

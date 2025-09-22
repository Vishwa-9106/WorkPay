const express = require('express');
const router = express.Router();
const Production = require('../models/Production');

// GET /api/production - Get all production records
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, worker, machineNumber, shift } = req.query;
    
    // Build filter object
    let filter = {};
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    if (worker) filter.worker = worker;
    if (machineNumber) filter.machineNumber = machineNumber;
    if (shift) filter.shift = shift;

    const production = await Production.find(filter)
      .populate('worker', 'name phone')
      .sort({ date: -1 });
    
    // Calculate totals
    const totalQuantity = production.reduce((sum, record) => sum + record.quantityProduced, 0);
    const totalWastage = production.reduce((sum, record) => sum + record.wastage, 0);
    
    res.json({
      success: true,
      count: production.length,
      totalQuantity: totalQuantity,
      totalWastage: totalWastage,
      data: production
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

// GET /api/production/:id - Get single production record
router.get('/:id', async (req, res) => {
  try {
    const production = await Production.findById(req.params.id)
      .populate('worker', 'name phone');
    
    if (!production) {
      return res.status(404).json({
        success: false,
        error: 'Production record not found'
      });
    }

    res.json({
      success: true,
      data: production
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

// POST /api/production - Create new production record
router.post('/', async (req, res) => {
  try {
    const production = await Production.create(req.body);
    const populatedProduction = await Production.findById(production._id)
      .populate('worker', 'name phone');
    
    res.status(201).json({
      success: true,
      data: populatedProduction
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: messages.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

// PUT /api/production/:id - Update production record
router.put('/:id', async (req, res) => {
  try {
    const production = await Production.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('worker', 'name phone');

    if (!production) {
      return res.status(404).json({
        success: false,
        error: 'Production record not found'
      });
    }

    res.json({
      success: true,
      data: production
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: messages.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

// DELETE /api/production/:id - Delete production record
router.delete('/:id', async (req, res) => {
  try {
    const production = await Production.findByIdAndDelete(req.params.id);

    if (!production) {
      return res.status(404).json({
        success: false,
        error: 'Production record not found'
      });
    }

    res.json({
      success: true,
      message: 'Production record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

// GET /api/production/stats/summary - Get production statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchFilter = {};
    if (startDate || endDate) {
      matchFilter.date = {};
      if (startDate) matchFilter.date.$gte = new Date(startDate);
      if (endDate) matchFilter.date.$lte = new Date(endDate);
    }

    const stats = await Production.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$shift',
          totalQuantity: { $sum: '$quantityProduced' },
          totalWastage: { $sum: '$wastage' },
          count: { $sum: 1 },
          averageQuantity: { $avg: '$quantityProduced' }
        }
      },
      { $sort: { totalQuantity: -1 } }
    ]);

    const workerStats = await Production.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$worker',
          totalQuantity: { $sum: '$quantityProduced' },
          totalWastage: { $sum: '$wastage' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'workers',
          localField: '_id',
          foreignField: '_id',
          as: 'workerInfo'
        }
      },
      { $unwind: '$workerInfo' },
      { $sort: { totalQuantity: -1 } }
    ]);

    const overallStats = await Production.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantityProduced' },
          totalWastage: { $sum: '$wastage' },
          totalRecords: { $sum: 1 },
          averageQuantity: { $avg: '$quantityProduced' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byShift: stats,
        byWorker: workerStats,
        overall: overallStats[0] || { 
          totalQuantity: 0, 
          totalWastage: 0, 
          totalRecords: 0, 
          averageQuantity: 0 
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

module.exports = router;
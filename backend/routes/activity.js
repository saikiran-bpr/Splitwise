const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;

    const activities = await Activity.find({
      involvedUsers: req.user._id
    })
      .populate('actor', 'name email')
      .populate('group', 'name')
      .populate('targetUser', 'name email')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Activity.countDocuments({ involvedUsers: req.user._id });

    res.json({
      success: true,
      activities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/group/:groupId', async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;

    const activities = await Activity.find({ group: req.params.groupId })
      .populate('actor', 'name email')
      .populate('targetUser', 'name email')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Activity.countDocuments({ group: req.params.groupId });

    res.json({
      success: true,
      activities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

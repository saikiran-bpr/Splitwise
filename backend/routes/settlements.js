const express = require('express');
const router = express.Router();
const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', async (req, res) => {
  try {
    const { groupId, payeeId, amount, note, date } = req.body;

    if (!payeeId || !amount) {
      return res.status(400).json({ success: false, message: 'Payee and amount are required' });
    }

    if (payeeId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot settle with yourself' });
    }

    const payee = await User.findById(payeeId);
    if (!payee) {
      return res.status(404).json({ success: false, message: 'Payee not found' });
    }

    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }
    }

    const settlement = await Settlement.create({
      group: groupId || null,
      payer: req.user._id,
      payee: payeeId,
      amount,
      note: note || '',
      date: date || new Date(),
      createdBy: req.user._id
    });

    let groupName = null;
    if (groupId) {
      const group = await Group.findById(groupId);
      groupName = group ? group.name : null;
    }

    await Activity.create({
      type: 'settlement_added',
      actor: req.user._id,
      group: groupId || null,
      settlement: settlement._id,
      targetUser: payeeId,
      metadata: {
        amount,
        targetUserName: payee.name,
        groupName
      },
      involvedUsers: [req.user._id, payeeId]
    });

    const populatedSettlement = await Settlement.findById(settlement._id)
      .populate('payer', 'name email')
      .populate('payee', 'name email');

    res.status(201).json({ success: true, settlement: populatedSettlement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const settlements = await Settlement.find({
      $or: [
        { payer: req.user._id },
        { payee: req.user._id }
      ]
    })
      .populate('payer', 'name email')
      .populate('payee', 'name email')
      .populate('group', 'name')
      .sort('-date');

    res.json({ success: true, settlements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/group/:groupId', async (req, res) => {
  try {
    const settlements = await Settlement.find({ group: req.params.groupId })
      .populate('payer', 'name email')
      .populate('payee', 'name email')
      .sort('-date');

    res.json({ success: true, settlements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id);
    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found' });
    }

    if (settlement.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator can delete this settlement' });
    }

    await Settlement.findByIdAndDelete(settlement._id);

    res.json({ success: true, message: 'Settlement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

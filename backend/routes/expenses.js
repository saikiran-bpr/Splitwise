const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');
const { calculateSplits, getInvolvedUsers } = require('../utils/helpers');

router.use(protect);

router.post('/', async (req, res) => {
  try {
    const { groupId, description, amount, category, paidBy, splitType, splitData, members, notes, date, isRecurring, recurringInterval } = req.body;

    if (!description || !amount) {
      return res.status(400).json({ success: false, message: 'Description and amount are required' });
    }

    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }
      const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
      if (!isMember) {
        return res.status(403).json({ success: false, message: 'Not a member of this group' });
      }
    }

    const payerId = paidBy || req.user._id;
    const type = splitType || 'equal';
    const splitMembers = members || (splitData ? splitData.map(s => s.userId) : [req.user._id]);

    let splits;
    if (type === 'equal') {
      splits = calculateSplits(amount, 'equal', splitMembers, null);
    } else {
      splits = calculateSplits(amount, type, splitMembers, splitData);
    }

    const expense = await Expense.create({
      group: groupId || null,
      description,
      amount,
      category: category || 'other',
      paidBy: payerId,
      splitType: type,
      splits,
      notes: notes || '',
      date: date || new Date(),
      isRecurring: isRecurring || false,
      recurringInterval: recurringInterval || null,
      createdBy: req.user._id
    });

    const involvedUsers = getInvolvedUsers(expense);

    await Activity.create({
      type: 'expense_added',
      actor: req.user._id,
      group: groupId || null,
      expense: expense._id,
      metadata: {
        description,
        amount,
        groupName: groupId ? (await Group.findById(groupId)).name : null
      },
      involvedUsers
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, expense: populatedExpense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/group/:groupId', async (req, res) => {
  try {
    const { page = 1, limit = 50, category } = req.query;
    const query = { group: req.params.groupId };
    if (category) query.category = category;

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email')
      .populate('comments.user', 'name')
      .sort('-date')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      expenses,
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

router.get('/user', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const expenses = await Expense.find({
      $or: [
        { paidBy: req.user._id },
        { 'splits.user': req.user._id }
      ]
    })
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email')
      .populate('group', 'name')
      .sort('-date')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Expense.countDocuments({
      $or: [
        { paidBy: req.user._id },
        { 'splits.user': req.user._id }
      ]
    });

    res.json({
      success: true,
      expenses,
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

router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email')
      .populate('comments.user', 'name email')
      .populate('createdBy', 'name email')
      .populate('group', 'name');

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (expense.createdBy.toString() !== req.user._id.toString() &&
        expense.paidBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator or payer can edit this expense' });
    }

    const { description, amount, category, splitType, splitData, members, notes, date } = req.body;

    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (category) expense.category = category;
    if (notes !== undefined) expense.notes = notes;
    if (date) expense.date = date;

    if (splitType || splitData || members) {
      const type = splitType || expense.splitType;
      const effectiveAmount = amount || expense.amount;
      const splitMembers = members || splitData?.map(s => s.userId) || expense.splits.map(s => s.user);

      if (type === 'equal') {
        expense.splits = calculateSplits(effectiveAmount, 'equal', splitMembers, null);
      } else {
        expense.splits = calculateSplits(effectiveAmount, type, splitMembers, splitData);
      }
      expense.splitType = type;
    }

    await expense.save();

    await Activity.create({
      type: 'expense_updated',
      actor: req.user._id,
      group: expense.group,
      expense: expense._id,
      metadata: {
        description: expense.description,
        amount: expense.amount
      },
      involvedUsers: getInvolvedUsers(expense)
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email')
      .populate('createdBy', 'name email');

    res.json({ success: true, expense: populatedExpense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (expense.createdBy.toString() !== req.user._id.toString() &&
        expense.paidBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator or payer can delete this expense' });
    }

    const involvedUsers = getInvolvedUsers(expense);

    await Activity.create({
      type: 'expense_deleted',
      actor: req.user._id,
      group: expense.group,
      metadata: {
        description: expense.description,
        amount: expense.amount
      },
      involvedUsers
    });

    await Expense.findByIdAndDelete(expense._id);

    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    expense.comments.push({ user: req.user._id, text });
    await expense.save();

    await Activity.create({
      type: 'comment_added',
      actor: req.user._id,
      group: expense.group,
      expense: expense._id,
      metadata: { description: expense.description },
      involvedUsers: getInvolvedUsers(expense)
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('comments.user', 'name email');

    res.json({ success: true, comments: populatedExpense.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const comment = expense.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Can only delete your own comments' });
    }

    expense.comments.pull(req.params.commentId);
    await expense.save();

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

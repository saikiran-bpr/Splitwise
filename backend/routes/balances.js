const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { simplifyDebts } = require('../utils/debtSimplifier');

router.use(protect);

router.get('/overall', async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const expenses = await Expense.find({
      $or: [
        { paidBy: req.user._id },
        { 'splits.user': req.user._id }
      ]
    });

    const settlements = await Settlement.find({
      $or: [
        { payer: req.user._id },
        { payee: req.user._id }
      ]
    });

    const balanceMap = {};

    for (const expense of expenses) {
      const payerId = expense.paidBy.toString();

      for (const split of expense.splits) {
        const splitUserId = split.user.toString();

        if (payerId === userId && splitUserId !== userId) {
          if (!balanceMap[splitUserId]) balanceMap[splitUserId] = 0;
          balanceMap[splitUserId] += split.amount;
        } else if (splitUserId === userId && payerId !== userId) {
          if (!balanceMap[payerId]) balanceMap[payerId] = 0;
          balanceMap[payerId] -= split.amount;
        }
      }
    }

    for (const settlement of settlements) {
      const payerId = settlement.payer.toString();
      const payeeId = settlement.payee.toString();

      if (payerId === userId) {
        if (!balanceMap[payeeId]) balanceMap[payeeId] = 0;
        balanceMap[payeeId] -= settlement.amount;
      } else if (payeeId === userId) {
        if (!balanceMap[payerId]) balanceMap[payerId] = 0;
        balanceMap[payerId] += settlement.amount;
      }
    }

    let totalOwed = 0;
    let totalOwe = 0;
    const friendBalances = [];

    const userIds = Object.keys(balanceMap);
    const users = await User.find({ _id: { $in: userIds } }).select('name email');
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    for (const [friendId, amount] of Object.entries(balanceMap)) {
      const roundedAmount = Math.round(amount * 100) / 100;
      if (Math.abs(roundedAmount) > 0.01) {
        const friend = userMap[friendId];
        friendBalances.push({
          user: friend || { _id: friendId, name: 'Unknown', email: '' },
          amount: roundedAmount
        });
        if (roundedAmount > 0) totalOwed += roundedAmount;
        else totalOwe += Math.abs(roundedAmount);
      }
    }

    friendBalances.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    res.json({
      success: true,
      totalOwed: Math.round(totalOwed * 100) / 100,
      totalOwe: Math.round(totalOwe * 100) / 100,
      netBalance: Math.round((totalOwed - totalOwe) * 100) / 100,
      friendBalances
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/group/:groupId', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members.user', 'name email');
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const expenses = await Expense.find({ group: req.params.groupId });
    const settlements = await Settlement.find({ group: req.params.groupId });

    const balances = {};
    group.members.forEach(m => {
      balances[m.user._id.toString()] = 0;
    });

    for (const expense of expenses) {
      const payerId = expense.paidBy.toString();
      for (const split of expense.splits) {
        const splitUserId = split.user.toString();
        if (balances[payerId] !== undefined) balances[payerId] += split.amount;
        if (balances[splitUserId] !== undefined) balances[splitUserId] -= split.amount;
      }
    }

    for (const settlement of settlements) {
      const payerId = settlement.payer.toString();
      const payeeId = settlement.payee.toString();
      if (balances[payerId] !== undefined) balances[payerId] -= settlement.amount;
      if (balances[payeeId] !== undefined) balances[payeeId] += settlement.amount;
    }

    const memberMap = {};
    group.members.forEach(m => {
      memberMap[m.user._id.toString()] = m.user;
    });

    const memberBalances = Object.entries(balances).map(([userId, amount]) => ({
      user: memberMap[userId],
      amount: Math.round(amount * 100) / 100
    }));

    let simplifiedDebts = [];
    if (group.simplifyDebts) {
      const rawDebts = simplifyDebts(balances);
      simplifiedDebts = rawDebts.map(d => ({
        from: memberMap[d.from] || { _id: d.from, name: 'Unknown' },
        to: memberMap[d.to] || { _id: d.to, name: 'Unknown' },
        amount: d.amount
      }));
    }

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      success: true,
      memberBalances,
      simplifiedDebts,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      expenseCount: expenses.length,
      settlementCount: settlements.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/friend/:friendId', async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const friendId = req.params.friendId;

    const friend = await User.findById(friendId).select('name email');
    if (!friend) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const expenses = await Expense.find({
      $or: [
        { paidBy: userId, 'splits.user': friendId },
        { paidBy: friendId, 'splits.user': userId }
      ]
    }).populate('group', 'name').sort('-date');

    const settlements = await Settlement.find({
      $or: [
        { payer: userId, payee: friendId },
        { payer: friendId, payee: userId }
      ]
    }).sort('-date');

    let balance = 0;

    for (const expense of expenses) {
      const payerId = expense.paidBy.toString();
      for (const split of expense.splits) {
        const splitUserId = split.user.toString();
        if (payerId === userId && splitUserId === friendId) {
          balance += split.amount;
        } else if (payerId === friendId && splitUserId === userId) {
          balance -= split.amount;
        }
      }
    }

    for (const settlement of settlements) {
      if (settlement.payer.toString() === userId) {
        balance -= settlement.amount;
      } else {
        balance += settlement.amount;
      }
    }

    const groupBreakdown = {};
    for (const expense of expenses) {
      const groupKey = expense.group ? expense.group._id.toString() : 'no-group';
      const groupName = expense.group ? expense.group.name : 'Non-group expenses';

      if (!groupBreakdown[groupKey]) {
        groupBreakdown[groupKey] = { groupName, balance: 0 };
      }

      const payerId = expense.paidBy.toString();
      for (const split of expense.splits) {
        const splitUserId = split.user.toString();
        if (payerId === userId && splitUserId === friendId) {
          groupBreakdown[groupKey].balance += split.amount;
        } else if (payerId === friendId && splitUserId === userId) {
          groupBreakdown[groupKey].balance -= split.amount;
        }
      }
    }

    res.json({
      success: true,
      friend,
      balance: Math.round(balance * 100) / 100,
      expenses: expenses.slice(0, 20),
      settlements: settlements.slice(0, 20),
      groupBreakdown: Object.values(groupBreakdown).filter(g => Math.abs(g.balance) > 0.01)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

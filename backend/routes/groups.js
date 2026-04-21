const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id,
      isActive: true
    }).populate('members.user', 'name email').populate('createdBy', 'name email').sort('-updatedAt');

    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, category, memberIds } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    const members = [{ user: req.user._id, role: 'admin' }];
    if (memberIds && memberIds.length > 0) {
      for (const id of memberIds) {
        if (id !== req.user._id.toString()) {
          members.push({ user: id, role: 'member' });
        }
      }
    }

    const group = await Group.create({
      name,
      description,
      category,
      members,
      createdBy: req.user._id
    });

    const allMemberIds = members.map(m => m.user);
    await User.updateMany(
      { _id: { $in: allMemberIds } },
      { $addToSet: { groups: group._id } }
    );

    await Activity.create({
      type: 'group_created',
      actor: req.user._id,
      group: group._id,
      metadata: { groupName: name },
      involvedUsers: allMemberIds
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, group: populatedGroup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not a member of this group' });
    }

    const expenses = await Expense.find({ group: group._id })
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email')
      .populate('comments.user', 'name')
      .sort('-date');

    const settlements = await Settlement.find({ group: group._id })
      .populate('payer', 'name email')
      .populate('payee', 'name email')
      .sort('-date');

    res.json({ success: true, group, expenses, settlements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isAdmin = group.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can update the group' });
    }

    const { name, description, category, simplifyDebts } = req.body;
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (category) group.category = category;
    if (simplifyDebts !== undefined) group.simplifyDebts = simplifyDebts;

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    await Activity.create({
      type: 'group_updated',
      actor: req.user._id,
      group: group._id,
      metadata: { groupName: group.name },
      involvedUsers: group.members.map(m => m.user)
    });

    res.json({ success: true, group: populatedGroup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isAdmin = group.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can delete the group' });
    }

    const memberIds = group.members.map(m => m.user);

    await Expense.deleteMany({ group: group._id });
    await Settlement.deleteMany({ group: group._id });
    await Activity.deleteMany({ group: group._id });

    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { groups: group._id } }
    );

    group.isActive = false;
    await group.save();

    res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/members', async (req, res) => {
  try {
    const { userIds } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not a member of this group' });
    }

    const existingMemberIds = group.members.map(m => m.user.toString());
    const newMembers = userIds.filter(id => !existingMemberIds.includes(id));

    if (newMembers.length === 0) {
      return res.status(400).json({ success: false, message: 'All users are already members' });
    }

    for (const userId of newMembers) {
      group.members.push({ user: userId, role: 'member' });
    }
    await group.save();

    await User.updateMany(
      { _id: { $in: newMembers } },
      { $addToSet: { groups: group._id } }
    );

    const addedUsers = await User.find({ _id: { $in: newMembers } }).select('name');
    for (const addedUser of addedUsers) {
      await Activity.create({
        type: 'member_added',
        actor: req.user._id,
        group: group._id,
        targetUser: addedUser._id,
        metadata: {
          groupName: group.name,
          targetUserName: addedUser.name
        },
        involvedUsers: [...group.members.map(m => m.user)]
      });
    }

    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    res.json({ success: true, group: populatedGroup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isAdmin = group.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );
    const isSelf = req.params.userId === req.user._id.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: 'Only admins can remove members' });
    }

    const memberIndex = group.members.findIndex(m => m.user.toString() === req.params.userId);
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: 'Member not found in group' });
    }

    const removedUser = await User.findById(req.params.userId).select('name');

    group.members.splice(memberIndex, 1);
    await group.save();

    await User.findByIdAndUpdate(req.params.userId, { $pull: { groups: group._id } });

    await Activity.create({
      type: 'member_removed',
      actor: req.user._id,
      group: group._id,
      targetUser: req.params.userId,
      metadata: {
        groupName: group.name,
        targetUserName: removedUser ? removedUser.name : 'Unknown'
      },
      involvedUsers: [...group.members.map(m => m.user), req.params.userId]
    });

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

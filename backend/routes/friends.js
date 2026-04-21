const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'name email phone');
    res.json({ success: true, friends: user.friends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    if (email.toLowerCase() === req.user.email) {
      return res.status(400).json({ success: false, message: 'You cannot add yourself as a friend' });
    }

    const friend = await User.findOne({ email: email.toLowerCase() });
    if (!friend) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    const user = await User.findById(req.user._id);
    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ success: false, message: 'Already friends with this user' });
    }

    user.friends.push(friend._id);
    await user.save();

    if (!friend.friends.includes(req.user._id)) {
      friend.friends.push(req.user._id);
      await friend.save();
    }

    await Activity.create({
      type: 'friend_added',
      actor: req.user._id,
      targetUser: friend._id,
      metadata: {
        targetUserName: friend.name
      },
      involvedUsers: [req.user._id, friend._id]
    });

    const populatedFriend = await User.findById(friend._id).select('name email phone');
    res.status(201).json({ success: true, friend: populatedFriend });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:friendId', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const friendIndex = user.friends.indexOf(req.params.friendId);

    if (friendIndex === -1) {
      return res.status(404).json({ success: false, message: 'Friend not found' });
    }

    user.friends.splice(friendIndex, 1);
    await user.save();

    const friend = await User.findById(req.params.friendId);
    if (friend) {
      const reverseIndex = friend.friends.indexOf(req.user._id);
      if (reverseIndex !== -1) {
        friend.friends.splice(reverseIndex, 1);
        await friend.save();
      }
    }

    res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { email: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    }).select('name email').limit(20);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

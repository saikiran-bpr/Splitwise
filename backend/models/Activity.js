const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'expense_added',
      'expense_updated',
      'expense_deleted',
      'settlement_added',
      'group_created',
      'group_updated',
      'member_added',
      'member_removed',
      'friend_added',
      'comment_added'
    ],
    required: true
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  expense: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    default: null
  },
  settlement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Settlement',
    default: null
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  metadata: {
    description: String,
    amount: Number,
    groupName: String,
    targetUserName: String
  },
  involvedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

activitySchema.index({ involvedUsers: 1, createdAt: -1 });
activitySchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);

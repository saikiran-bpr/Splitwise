const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true,
    maxlength: 200
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: [0.01, 'Amount must be at least 0.01']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  category: {
    type: String,
    enum: ['food', 'transport', 'entertainment', 'shopping', 'utilities', 'rent', 'travel', 'health', 'education', 'other'],
    default: 'other'
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  splitType: {
    type: String,
    enum: ['equal', 'exact', 'percentage', 'shares'],
    default: 'equal'
  },
  splits: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 1
    },
    isPaid: {
      type: Boolean,
      default: false
    }
  }],
  notes: {
    type: String,
    default: '',
    maxlength: 1000
  },
  date: {
    type: Date,
    default: Date.now
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringInterval: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly', null],
    default: null
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

expenseSchema.index({ group: 1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ 'splits.user': 1 });
expenseSchema.index({ date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);

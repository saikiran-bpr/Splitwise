const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  note: {
    type: String,
    default: '',
    maxlength: 500
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

settlementSchema.index({ group: 1 });
settlementSchema.index({ payer: 1 });
settlementSchema.index({ payee: 1 });

module.exports = mongoose.model('Settlement', settlementSchema);

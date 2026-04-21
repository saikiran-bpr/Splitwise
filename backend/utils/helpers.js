function calculateSplits(amount, splitType, members, splitData) {
  const splits = [];

  switch (splitType) {
    case 'equal': {
      const perPerson = Math.round((amount / members.length) * 100) / 100;
      let remaining = amount;
      members.forEach((userId, index) => {
        const splitAmount = index === members.length - 1 ? remaining : perPerson;
        remaining -= perPerson;
        splits.push({
          user: userId,
          amount: splitAmount,
          percentage: Math.round((100 / members.length) * 100) / 100,
          shares: 1
        });
      });
      break;
    }

    case 'exact': {
      splitData.forEach(item => {
        splits.push({
          user: item.userId,
          amount: item.amount,
          percentage: Math.round((item.amount / amount) * 100 * 100) / 100,
          shares: 1
        });
      });
      break;
    }

    case 'percentage': {
      splitData.forEach(item => {
        splits.push({
          user: item.userId,
          amount: Math.round((amount * item.percentage / 100) * 100) / 100,
          percentage: item.percentage,
          shares: 1
        });
      });
      break;
    }

    case 'shares': {
      const totalShares = splitData.reduce((sum, item) => sum + item.shares, 0);
      splitData.forEach(item => {
        splits.push({
          user: item.userId,
          amount: Math.round((amount * item.shares / totalShares) * 100) / 100,
          percentage: Math.round((item.shares / totalShares) * 100 * 100) / 100,
          shares: item.shares
        });
      });
      break;
    }

    default:
      throw new Error('Invalid split type');
  }

  return splits;
}

function getInvolvedUsers(expense) {
  const users = new Set();
  users.add(expense.paidBy.toString());
  expense.splits.forEach(s => users.add(s.user.toString()));
  return Array.from(users);
}

module.exports = { calculateSplits, getInvolvedUsers };

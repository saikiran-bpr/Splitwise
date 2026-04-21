function simplifyDebts(balances) {
  const netAmounts = {};

  for (const [userId, amount] of Object.entries(balances)) {
    if (Math.abs(amount) > 0.01) {
      netAmounts[userId] = amount;
    }
  }

  const creditors = [];
  const debtors = [];

  for (const [userId, amount] of Object.entries(netAmounts)) {
    if (amount > 0) {
      creditors.push({ userId, amount });
    } else if (amount < 0) {
      debtors.push({ userId, amount: Math.abs(amount) });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const settleAmount = Math.min(creditors[i].amount, debtors[j].amount);

    if (settleAmount > 0.01) {
      transactions.push({
        from: debtors[j].userId,
        to: creditors[i].userId,
        amount: Math.round(settleAmount * 100) / 100
      });
    }

    creditors[i].amount -= settleAmount;
    debtors[j].amount -= settleAmount;

    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }

  return transactions;
}

module.exports = { simplifyDebts };

import Papa from 'papaparse';
import { Holding, Transaction } from '@/types';
import { formatDateString } from './format';

export function exportPortfolioToCSV(
  holdings: Array<{
    holding: Holding;
    currentPrice: number;
    change: number;
    changePercent: number;
  }>
) {
  const data = holdings.map(({ holding, currentPrice, changePercent }) => {
    const totalValue = holding.quantity * currentPrice;
    const totalCost = holding.quantity * holding.averageCost;
    const gainLoss = totalValue - totalCost;
    const gainLossPercent = (gainLoss / totalCost) * 100;

    return {
      Ticker: holding.asset?.ticker,
      Name: holding.asset?.name,
      Type: holding.asset?.assetType,
      Quantity: holding.quantity,
      'Average Cost': holding.averageCost.toFixed(2),
      'Current Price': currentPrice.toFixed(2),
      'Total Value': totalValue.toFixed(2),
      'Total Cost': totalCost.toFixed(2),
      'Gain/Loss': gainLoss.toFixed(2),
      'Gain/Loss %': gainLossPercent.toFixed(2),
      'Today Change %': changePercent.toFixed(2),
    };
  });

  const csv = Papa.unparse(data);
  downloadCSV(csv, `portfolio-${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportTransactionsToCSV(transactions: Transaction[]) {
  const data = transactions.map((tx) => ({
    Date: formatDateString(tx.transactionDate, 'yyyy-MM-dd'),
    Type: tx.transactionType.toUpperCase(),
    Ticker: tx.asset?.ticker,
    Name: tx.asset?.name,
    Quantity: tx.quantity,
    Price: tx.price.toFixed(2),
    Fees: tx.fees.toFixed(2),
    Total: (tx.quantity * tx.price + tx.fees).toFixed(2),
    Notes: tx.notes || '',
  }));

  const csv = Papa.unparse(data);
  downloadCSV(csv, `transactions-${new Date().toISOString().split('T')[0]}.csv`);
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

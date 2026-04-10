import { Transaction } from '@/types';
import { formatCurrency, formatDateString } from '@/lib/utils/format';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className={`rounded-full p-2 ${
              transaction.transactionType === 'buy' ? 'bg-success/10' : 'bg-destructive/10'
            }`}>
              {transaction.transactionType === 'buy' ? (
                <ArrowDownRight className="h-4 w-4 text-success" />
              ) : (
                <ArrowUpRight className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div>
              <div className="font-medium">{transaction.asset?.ticker}</div>
              <div className="text-sm text-muted-foreground">
                {formatDateString(transaction.transactionDate)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">
              {transaction.quantity} shares @ {formatCurrency(transaction.price)}
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {formatCurrency(transaction.quantity * transaction.price)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

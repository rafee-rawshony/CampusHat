interface CurrencyDisplayProps {
  amount: number
  className?: string
}

export function CurrencyDisplay({ amount, className }: CurrencyDisplayProps) {
  return (
    <span className={className}>
      ৳{amount.toLocaleString('en-BD')}
    </span>
  )
}

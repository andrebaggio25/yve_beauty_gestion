interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ className = '', lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`bg-slate-700 rounded ${i === 0 ? 'mb-2' : i < lines - 1 ? 'mb-2' : ''}`}
          style={{ height: i === 0 ? '24px' : '16px', width: i === 0 ? '60%' : `${70 + Math.random() * 20}%` }}
        />
      ))}
    </div>
  )
}

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex space-x-4 mb-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="bg-slate-700 rounded h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 mb-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="bg-slate-700 rounded h-4 flex-1"
              style={{ width: colIndex === 0 ? '40%' : colIndex === columns - 1 ? '20%' : '25%' }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface CardSkeletonProps {
  cards?: number
}

export function CardSkeleton({ cards = 6 }: CardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-slate-800 rounded-lg border border-slate-700 p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-slate-700 rounded h-4 w-24" />
            <div className="bg-slate-700 rounded h-8 w-8" />
          </div>
          <div className="bg-slate-700 rounded h-8 w-20 mb-2" />
          <div className="bg-slate-700 rounded h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

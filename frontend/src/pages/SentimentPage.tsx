import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  Skeleton,
  SkeletonText,
} from '@/components/common'
import { useApi } from '@/hooks/useApi'
import { sentimentApi } from '@/api/resources'
import { formatDateTime } from '@/lib/utils'
import type { SentimentSnapshot } from '@/types'

function scoreLabel(score: number): { label: string; cls: string } {
  if (score > 0.15) return { label: 'Positive', cls: 'text-bull' }
  if (score < -0.15) return { label: 'Negative', cls: 'text-bear' }
  return { label: 'Neutral', cls: 'text-slate-500' }
}

/** Horizontal gauge from -1 (bearish) to +1 (bullish). */
function SentimentGauge({ score }: { score: number }) {
  const pct = ((score + 1) / 2) * 100 // map [-1,1] -> [0,100]
  const { label, cls } = scoreLabel(score)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-400">Bearish</span>
        <span className={`font-medium ${cls}`}>
          {label} ({score.toFixed(2)})
        </span>
        <span className="text-slate-400">Bullish</span>
      </div>
      <div className="relative h-2 rounded-full bg-gradient-to-r from-bear via-slate-200 to-bull">
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-800 shadow"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function SentimentCard({ snap }: { snap: SentimentSnapshot }) {
  return (
    <Card>
      <CardHeader title={snap.symbol} subtitle={formatDateTime(snap.timestamp)} />
      <CardBody className="space-y-5">
        <SentimentGauge score={snap.overall_sentiment} />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">News</h4>
            <span className={`text-xs font-medium ${scoreLabel(snap.news_sentiment).cls}`}>
              {snap.news_sentiment.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-slate-600">{snap.news_summary || 'No news summary.'}</p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Reddit</h4>
            <span className={`text-xs font-medium ${scoreLabel(snap.reddit_sentiment).cls}`}>
              {snap.reddit_sentiment.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-slate-600">{snap.reddit_summary || 'No Reddit summary.'}</p>
        </div>
      </CardBody>
    </Card>
  )
}

function SentimentCardSkeleton() {
  return (
    <Card>
      <CardHeader title={<Skeleton className="h-4 w-20" />} />
      <CardBody className="space-y-5">
        <Skeleton className="h-2 w-full" />
        <SkeletonText lines={2} />
        <SkeletonText lines={2} />
      </CardBody>
    </Card>
  )
}

export function SentimentPage() {
  const { data, loading, error } = useApi(() => sentimentApi.list(), [])

  return (
    <div>
      <PageHeader
        title="Sentiment"
        description="News and Reddit sentiment per tracked symbol"
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SentimentCardSkeleton key={i} />)
        ) : data && data.length > 0 ? (
          data.map((snap) => <SentimentCard key={`${snap.symbol}-${snap.timestamp}`} snap={snap} />)
        ) : (
          <div className="col-span-full rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
            No sentiment data yet.
          </div>
        )}
      </div>
    </div>
  )
}

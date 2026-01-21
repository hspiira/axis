/**
 * Provider Ratings Tab
 *
 * Displays feedback and ratings received by the provider
 */

import { useState, useMemo, useEffect } from 'react'
import { Star, MessageSquare, ThumbsUp, AlertCircle, Loader2, TrendingUp } from 'lucide-react'
import { type ServiceProvider } from '@/api/services'
import { useFeedbacks } from '@/hooks/useServices'
import { getProviderAverageRating } from '@/api/services'
import { SummaryStats } from '@/components/ui'
import { formatDate } from '@/utils/formatters'

interface ProviderRatingsTabProps {
  provider: ServiceProvider
}

export function ProviderRatingsTab({ provider }: ProviderRatingsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [ratingLoading, setRatingLoading] = useState(true)

  // Fetch all feedback
  const { data: allFeedback = [], isLoading, error } = useFeedbacks()

  // Fetch provider's average rating
  useEffect(() => {
    const fetchAverageRating = async () => {
      try {
        const result = await getProviderAverageRating(provider.id)
        setAverageRating(result.average_rating)
      } catch (err) {
        console.error('Failed to fetch average rating:', err)
        setAverageRating(null)
      } finally {
        setRatingLoading(false)
      }
    }
    fetchAverageRating()
  }, [provider.id])

  // Filter feedback for this provider
  const providerFeedback = useMemo(() => {
    return allFeedback.filter((feedback) => {
      return feedback.provider_name === provider.name
    })
  }, [allFeedback, provider.name])

  // Filter by search query
  const filteredFeedback = useMemo(() => {
    if (!searchQuery.trim()) return providerFeedback

    const query = searchQuery.toLowerCase()
    return providerFeedback.filter((feedback) => {
      const serviceName = feedback.service_name?.toLowerCase() || ''
      return serviceName.includes(query)
    })
  }, [providerFeedback, searchQuery])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalFeedback = providerFeedback.length
    const avgOverallRating = averageRating || (provider.rating ? parseFloat(provider.rating) : null)

    const avgProviderRating = providerFeedback.length > 0
      ? providerFeedback.reduce((sum, f) => sum + (f.provider_rating || 0), 0) / providerFeedback.filter(f => f.provider_rating).length
      : null

    const recommendCount = providerFeedback.filter((f) => f.would_recommend === true).length
    const recommendationRate = totalFeedback > 0 ? Math.round((recommendCount / totalFeedback) * 100) : 0

    // Rating distribution
    const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
      stars: rating,
      count: providerFeedback.filter((f) => Math.round(f.provider_rating || 0) === rating).length,
    }))

    return {
      totalFeedback,
      avgOverallRating,
      avgProviderRating,
      recommendCount,
      recommendationRate,
      ratingDistribution,
    }
  }, [providerFeedback, averageRating, provider.rating])

  // Loading state
  if (isLoading || ratingLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cream-500" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-400">Failed to load feedback</p>
        <p className="text-sm text-gray-500 mt-1">
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Rating Statistics */}
      <SummaryStats
        variant="cards"
        columns={4}
        stats={[
          {
            label: 'Total Feedback',
            value: stats.totalFeedback,
            icon: MessageSquare,
            iconColor: 'text-cream-400',
            color: 'text-white',
          },
          {
            label: 'Average Rating',
            value: stats.avgProviderRating ? stats.avgProviderRating.toFixed(1) : '—',
            icon: Star,
            iconColor: 'text-amber-400',
            color: 'text-white',
          },
          {
            label: 'Would Recommend',
            value: stats.recommendCount,
            icon: ThumbsUp,
            iconColor: 'text-emerald-400',
            color: 'text-white',
          },
          {
            label: 'Recommendation Rate',
            value: `${stats.recommendationRate}%`,
            icon: TrendingUp,
            iconColor: 'text-purple-400',
            color: 'text-white',
          },
        ]}
      />

      {/* Rating Distribution */}
      {stats.totalFeedback > 0 && (
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-cream-400" />
            Rating Distribution
          </h3>
          <div className="space-y-3">
            {stats.ratingDistribution.map((item) => {
              const percentage = stats.totalFeedback > 0 ? (item.count / stats.totalFeedback) * 100 : 0
              return (
                <div key={item.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm text-white font-medium">{item.stars}</span>
                    <Star className="h-3 w-3 text-amber-400 fill-current" />
                  </div>
                  <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-12 text-right">{item.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-cream-400" />
          Recent Feedback
        </h3>

        {filteredFeedback.length > 0 ? (
          <div className="space-y-4">
            {filteredFeedback.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-white/5 border border-cream-500/10 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {feedback.provider_rating && (
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < feedback.provider_rating!
                                  ? 'text-amber-400 fill-current'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      {feedback.would_recommend && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <ThumbsUp className="h-3 w-3" />
                          Would Recommend
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      Service: <span className="text-white">{feedback.service_name}</span>
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(feedback.created_at)}
                  </span>
                </div>
                {feedback.provider_rating && (
                  <div className="text-sm text-white">
                    Provider Rating: {feedback.provider_rating}/5
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {searchQuery ? (
              <>
                <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No feedback found matching your search</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-sm text-cream-400 hover:text-cream-300 transition-colors"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <Star className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No feedback received yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Feedback will appear here after sessions are completed and rated
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

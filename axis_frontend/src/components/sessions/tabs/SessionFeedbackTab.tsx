/**
 * Session Feedback Tab
 *
 * Displays and allows submission of session feedback
 */

import { useState, useEffect } from 'react'
import { Star, ThumbsUp, MessageSquare, Save, Loader2 } from 'lucide-react'
import { type ServiceSession } from '@/api/services'
import { useFeedbacks, useCreateFeedback } from '@/hooks/useServices'

interface SessionFeedbackTabProps {
  session: ServiceSession
}

export function SessionFeedbackTab({ session }: SessionFeedbackTabProps) {
  const { data: allFeedback = [], isLoading } = useFeedbacks()
  const createFeedbackMutation = useCreateFeedback()

  const [rating, setRating] = useState(5)
  const [serviceRating, setServiceRating] = useState(5)
  const [providerRating, setProviderRating] = useState(5)
  const [comments, setComments] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState(true)

  // Find existing feedback for this session
  const existingFeedback = allFeedback.find((f) => f.session_id === session.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createFeedbackMutation.mutateAsync({
        session_id: session.id,
        rating,
        service_rating: serviceRating,
        provider_rating: providerRating,
        comments: comments || undefined,
        would_recommend: wouldRecommend,
      })
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  const RatingStars = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-colors"
          >
            <Star
              className={`h-6 w-6 ${
                star <= value ? 'text-amber-400 fill-current' : 'text-gray-600'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-white font-medium">{value}/5</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cream-500" />
      </div>
    )
  }

  // If feedback already exists, show it
  if (existingFeedback) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Session Feedback</h2>
          <p className="text-sm text-gray-400">
            Feedback for this session has been submitted
          </p>
        </div>

        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
          {/* Overall Rating */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Overall Rating</h3>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-6 w-6 ${
                    i < existingFeedback.rating ? 'text-amber-400 fill-current' : 'text-gray-600'
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-white font-medium">
                {existingFeedback.rating}/5
              </span>
            </div>
          </div>

          {/* Service Rating */}
          {existingFeedback.service_rating && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Service Rating</h3>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 ${
                      i < existingFeedback.service_rating! ? 'text-amber-400 fill-current' : 'text-gray-600'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-white font-medium">
                  {existingFeedback.service_rating}/5
                </span>
              </div>
            </div>
          )}

          {/* Provider Rating */}
          {existingFeedback.provider_rating && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Provider Rating</h3>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 ${
                      i < existingFeedback.provider_rating! ? 'text-amber-400 fill-current' : 'text-gray-600'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-white font-medium">
                  {existingFeedback.provider_rating}/5
                </span>
              </div>
            </div>
          )}

          {/* Would Recommend */}
          {existingFeedback.would_recommend !== null && (
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-emerald-400" />
                <span className="text-sm text-white">
                  {existingFeedback.would_recommend
                    ? 'Would recommend this service'
                    : 'Would not recommend this service'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show feedback form
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Submit Feedback</h2>
        <p className="text-sm text-gray-400">
          Share your experience with this session
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6 space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Overall Rating
            </label>
            <RatingStars value={rating} onChange={setRating} />
          </div>

          {/* Service Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Service Rating
            </label>
            <RatingStars value={serviceRating} onChange={setServiceRating} />
          </div>

          {/* Provider Rating */}
          {session.provider && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Provider Rating
              </label>
              <RatingStars value={providerRating} onChange={setProviderRating} />
            </div>
          )}

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Comments (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-cream-500/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cream-500/50"
              placeholder="Share any additional comments about your experience..."
            />
          </div>

          {/* Would Recommend */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wouldRecommend}
                onChange={(e) => setWouldRecommend(e.target.checked)}
                className="h-4 w-4 rounded border-cream-500/30 bg-[#0a0a0a] text-cream-500 focus:ring-2 focus:ring-cream-500/50"
              />
              <span className="text-sm text-gray-300">I would recommend this service</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createFeedbackMutation.isPending}
            className="px-6 py-3 bg-cream-500 text-gray-900 rounded-lg font-medium hover:bg-cream-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {createFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  )
}

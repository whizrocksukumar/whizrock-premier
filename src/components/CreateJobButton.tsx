'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Briefcase, Loader } from 'lucide-react'

interface CreateJobButtonProps {
  quoteId: string
  quoteNumber: string
  quoteStatus: string
}

export default function CreateJobButton({ quoteId, quoteNumber, quoteStatus }: CreateJobButtonProps) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // Only show button for Accepted quotes
  if (!['Accepted', 'Won'].includes(quoteStatus)) {
    return null
  }

  const handleCreateJob = async () => {
    if (!confirm(`Create a new job from quote ${quoteNumber}?`)) {
      return
    }

    try {
      setCreating(true)
      setError('')

      // Check if job already exists for this quote
      const { data: existingJob } = await supabase
        .from('jobs')
        .select('id, job_number')
        .eq('quote_id', quoteId)
        .single()

      if (existingJob) {
        if (confirm(`A job (${existingJob.job_number}) already exists for this quote. Do you want to view it?`)) {
          router.push(`/jobs/${existingJob.id}`)
        }
        return
      }

      // Call create_job_from_quote function
      const { data, error: funcError } = await supabase.rpc('create_job_from_quote', {
        p_quote_id: quoteId
      })

      if (funcError) throw funcError

      // Parse the result (function returns JSON)
      const result = typeof data === 'string' ? JSON.parse(data) : data

      if (!result.success) {
        throw new Error(result.message || 'Failed to create job')
      }

      // Show warnings if any (e.g., stock issues)
      if (result.warnings && result.warnings.length > 0) {
        alert('Job created with warnings:\n\n' + result.warnings.join('\n'))
      }

      // Redirect to the new job
      router.push(`/jobs/${result.job_id}`)

    } catch (err: any) {
      console.error('Error creating job:', err)
      setError(err.message || 'Failed to create job')
      alert('Error creating job: ' + (err.message || 'An unexpected error occurred'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <button
        onClick={handleCreateJob}
        disabled={creating}
        className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {creating ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Briefcase className="w-4 h-4" />
            Create Job
          </>
        )}
      </button>
      {error && (
        <div className="absolute top-full right-0 mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs max-w-xs">
          {error}
        </div>
      )}
    </>
  )
}

'use client'

import { WorksheetRenderer } from '@/components/worksheets/worksheet-renderer'
import type { WorksheetSchema } from '@/types/worksheet'

// Simplified 3-section thought record for the landing page demo.
// Shows enough to demonstrate the interactive experience without overwhelming.
const DEMO_SCHEMA: WorksheetSchema = {
  version: 1,
  sections: [
    {
      id: 'situation',
      title: 'Situation',
      description: 'What happened? Where were you? Who were you with?',
      fields: [
        {
          id: 'situation',
          type: 'textarea' as const,
          label: 'Describe the situation',
          required: true,
          placeholder: 'What were you doing? Where were you? Who was there?',
        },
      ],
    },
    {
      id: 'hot_thought',
      title: 'Hot Thought',
      description: 'What was the most distressing thought going through your mind?',
      fields: [
        {
          id: 'hot_thought',
          type: 'textarea' as const,
          label: 'Hot thought (automatic thought)',
          required: true,
          placeholder: 'What went through your mind? What did the situation mean to you?',
        },
        {
          id: 'belief_rating',
          type: 'likert' as const,
          label: 'How much do you believe this thought?',
          min: 0,
          max: 100,
          step: 5,
          anchors: {
            '0': 'Not at all',
            '50': 'Somewhat',
            '100': 'Completely',
          },
        },
      ],
    },
    {
      id: 'balanced',
      title: 'Balanced Thought',
      description: 'Having weighed the evidence, what is a more balanced way of thinking?',
      fields: [
        {
          id: 'balanced_thought',
          type: 'textarea' as const,
          label: 'Balanced / alternative thought',
          required: true,
          placeholder: 'Write a thought that takes into account both the evidence for and against.',
        },
        {
          id: 'balanced_belief',
          type: 'likert' as const,
          label: 'How much do you believe the balanced thought?',
          min: 0,
          max: 100,
          step: 5,
          anchors: {
            '0': 'Not at all',
            '50': 'Somewhat',
            '100': 'Completely',
          },
        },
      ],
    },
  ],
}

// Pre-filled example values showing a realistic clinical scenario
const DEMO_VALUES: Record<string, unknown> = {
  situation:
    'Preparing for a presentation at work. Sitting at my desk, colleagues nearby.',
  hot_thought:
    "I'm going to freeze up and everyone will think I'm incompetent.",
  belief_rating: 75,
  balanced_thought:
    "I've done presentations before and they went fine. Feeling nervous doesn't mean I'll freeze. Most people are focused on the content, not judging me.",
  balanced_belief: 60,
}

export function WorksheetPreview() {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Browser-chrome wrapper */}
      <div className="rounded-2xl border border-primary-200 bg-surface shadow-xl overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-3 border-b border-primary-100 bg-primary-50/50 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary-200" />
          </div>
          <p className="text-xs font-medium text-primary-500">
            7-Column Thought Record
          </p>
          <span className="ml-auto rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
            Interactive
          </span>
        </div>

        {/* Worksheet content */}
        <div className="p-4 sm:p-6 max-h-[520px] overflow-y-auto">
          <WorksheetRenderer
            schema={DEMO_SCHEMA}
            readOnly={false}
            initialValues={DEMO_VALUES}
          />
        </div>
      </div>

      {/* Caption */}
      <p className="mt-4 text-center text-sm text-primary-400">
        This is a real Formulate worksheet. Your clients fill these in between sessions.
      </p>
    </div>
  )
}

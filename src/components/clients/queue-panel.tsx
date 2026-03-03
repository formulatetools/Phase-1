'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  pushNextItem,
  skipItem,
  reorderItems,
  updateQueueSettings,
  pauseQueue,
  resumeQueue,
  deleteQueue,
} from '@/app/(dashboard)/clients/queue-actions'
import { useToast } from '@/hooks/use-toast'
import type { PlanQueue, PlanQueueItem, PlanQueuePushMode, Worksheet } from '@/types/database'

interface QueuePanelProps {
  queues: PlanQueue[]
  queueItems: PlanQueueItem[]
  worksheets: Worksheet[]
  relationshipId: string
}

const pushModeLabels: Record<PlanQueuePushMode, string> = {
  manual: 'Manual',
  time_based: 'Time-based',
  completion_based: 'On completion',
  both: 'Time + completion',
}

export function QueuePanel({ queues, queueItems, worksheets, relationshipId }: QueuePanelProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [settingsOpenId, setSettingsOpenId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Local order state for optimistic reordering (keyed by queue ID)
  const [localOrder, setLocalOrder] = useState<Record<string, string[]>>({})
  const reorderTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const dragItem = useRef<{ queueId: string; itemId: string } | null>(null)
  const dragOverItem = useRef<string | null>(null)

  const worksheetMap = new Map(worksheets.map((w) => [w.id, w]))

  const getItemTitle = (item: PlanQueueItem) => {
    if (item.item_type === 'worksheet' && item.worksheet_id) {
      return worksheetMap.get(item.worksheet_id)?.title || 'Unknown worksheet'
    }
    return item.resource_title || 'Resource'
  }

  const handlePush = async (queueId: string) => {
    setActionLoading(`push-${queueId}`)
    const result = await pushNextItem(queueId)
    setActionLoading(null)
    if (result.error) {
      toast({ type: 'error', message: result.error })
    } else {
      toast({ type: 'success', message: 'Item pushed to client' })
      router.refresh()
    }
  }

  const handleSkip = async (itemId: string) => {
    setActionLoading(`skip-${itemId}`)
    const result = await skipItem(itemId)
    setActionLoading(null)
    if (result.error) {
      toast({ type: 'error', message: result.error })
    } else {
      toast({ type: 'success', message: 'Item skipped' })
      router.refresh()
    }
  }

  // Persist reorder to server (debounced to batch rapid moves)
  const persistOrder = useCallback((queueId: string, orderedIds: string[]) => {
    if (reorderTimers.current[queueId]) clearTimeout(reorderTimers.current[queueId])
    reorderTimers.current[queueId] = setTimeout(async () => {
      const result = await reorderItems(queueId, orderedIds)
      if (result.error) {
        toast({ type: 'error', message: result.error })
      }
    }, 400)
  }, [toast])

  // Get the ordered queued items for a queue (local state or server order)
  const getQueuedOrder = (queueId: string, items: PlanQueueItem[]) => {
    const queuedItems = items.filter((i) => i.status === 'queued')
    const order = localOrder[queueId]
    if (!order) return queuedItems
    const itemMap = new Map(queuedItems.map((i) => [i.id, i]))
    return order.map((id) => itemMap.get(id)).filter(Boolean) as PlanQueueItem[]
  }

  // Optimistic arrow move (instant UI, debounced server persist)
  const handleMoveItem = (queueId: string, items: PlanQueueItem[], itemId: string, direction: 'up' | 'down') => {
    const ordered = getQueuedOrder(queueId, items)
    const idx = ordered.findIndex((i) => i.id === itemId)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= ordered.length) return

    const newOrder = ordered.map((i) => i.id)
    ;[newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]]
    setLocalOrder((prev) => ({ ...prev, [queueId]: newOrder }))
    persistOrder(queueId, newOrder)
  }

  // Drag and drop handlers
  const handleDragStart = (queueId: string, itemId: string) => {
    dragItem.current = { queueId, itemId }
  }

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault()
    dragOverItem.current = itemId
  }

  const handleDrop = (queueId: string, items: PlanQueueItem[]) => {
    if (!dragItem.current || !dragOverItem.current) return
    if (dragItem.current.queueId !== queueId) return
    if (dragItem.current.itemId === dragOverItem.current) return

    const ordered = getQueuedOrder(queueId, items)
    const ids = ordered.map((i) => i.id)
    const fromIdx = ids.indexOf(dragItem.current.itemId)
    const toIdx = ids.indexOf(dragOverItem.current)
    if (fromIdx === -1 || toIdx === -1) return

    const newOrder = [...ids]
    const [moved] = newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, moved)

    setLocalOrder((prev) => ({ ...prev, [queueId]: newOrder }))
    persistOrder(queueId, newOrder)
    dragItem.current = null
    dragOverItem.current = null
  }

  const handleDragEnd = () => {
    dragItem.current = null
    dragOverItem.current = null
  }

  const handleUpdateSettings = async (queueId: string, pushMode: PlanQueuePushMode, intervalDays: number) => {
    setActionLoading(`settings-${queueId}`)
    const result = await updateQueueSettings(queueId, { pushMode, intervalDays })
    setActionLoading(null)
    if (result.error) {
      toast({ type: 'error', message: result.error })
    } else {
      toast({ type: 'success', message: 'Queue settings updated' })
      setSettingsOpenId(null)
      router.refresh()
    }
  }

  const handlePause = async (queueId: string) => {
    setActionLoading(`pause-${queueId}`)
    const result = await pauseQueue(queueId)
    setActionLoading(null)
    if (result.error) {
      toast({ type: 'error', message: result.error })
    } else {
      toast({ type: 'success', message: 'Queue paused' })
      router.refresh()
    }
  }

  const handleResume = async (queueId: string) => {
    setActionLoading(`resume-${queueId}`)
    const result = await resumeQueue(queueId)
    setActionLoading(null)
    if (result.error) {
      toast({ type: 'error', message: result.error })
    } else {
      toast({ type: 'success', message: 'Queue resumed' })
      router.refresh()
    }
  }

  const handleDelete = async (queueId: string) => {
    setActionLoading(`delete-${queueId}`)
    const result = await deleteQueue(queueId)
    setActionLoading(null)
    setDeleteConfirmId(null)
    if (result.error) {
      toast({ type: 'error', message: result.error })
    } else {
      toast({ type: 'success', message: 'Queue deleted' })
      router.refresh()
    }
  }

  if (queues.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-primary-200 py-10 text-center dark:border-primary-700">
        <svg className="mx-auto h-10 w-10 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
        </svg>
        <p className="mt-3 text-sm font-medium text-primary-600 dark:text-primary-400">No homework queues</p>
        <p className="mt-1 text-xs text-primary-400 dark:text-primary-500">
          Apply a homework plan using &ldquo;Queue &amp; push&rdquo; to drip-feed items to your client.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {queues.map((queue) => {
        const items = queueItems
          .filter((i) => i.queue_id === queue.id)
          .sort((a, b) => a.position - b.position)
        const totalItems = items.length
        const pushedCount = items.filter((i) => i.status === 'pushed').length
        const orderedQueuedItems = getQueuedOrder(queue.id, items)
        const nonQueuedItems = items.filter((i) => i.status !== 'queued')
        const isCompleted = queue.status === 'completed'
        const isPaused = queue.status === 'paused'

        return (
          <div
            key={queue.id}
            className={`rounded-2xl border bg-surface shadow-sm overflow-hidden ${
              isCompleted
                ? 'border-green-200 dark:border-green-800'
                : isPaused
                  ? 'border-amber-200 dark:border-amber-800'
                  : 'border-primary-100 dark:border-primary-800'
            }`}
          >
            {/* Header */}
            <div className="p-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-primary-800 dark:text-primary-200 truncate">
                      {queue.name}
                    </h3>
                    {isCompleted && (
                      <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-300">
                        Completed
                      </span>
                    )}
                    {isPaused && (
                      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                        Paused
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-primary-400">
                    <span>{pushModeLabels[queue.push_mode]}</span>
                    <span>{pushedCount} of {totalItems} pushed</span>
                    {queue.last_pushed_at && (
                      <span>Last pushed {new Date(queue.last_pushed_at).toLocaleDateString('en-GB')}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 w-full rounded-full bg-primary-100 dark:bg-primary-800">
                <div
                  className={`h-1.5 rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-brand'}`}
                  style={{ width: `${totalItems > 0 ? (pushedCount / totalItems) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Items list */}
            <div className="border-t border-primary-100 dark:border-primary-800">
              {/* Non-queued items (pushed/skipped) — static */}
              {nonQueuedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-2.5 opacity-50 ${
                    idx > 0 ? 'border-t border-primary-50 dark:border-primary-800/50' : ''
                  }`}
                >
                  <div className="shrink-0">
                    {item.status === 'pushed' && (
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                    {item.status === 'skipped' && (
                      <svg className="h-4 w-4 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.69z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.item_type === 'worksheet' ? (
                        <svg className="h-3.5 w-3.5 shrink-0 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      ) : (
                        <svg className="h-3.5 w-3.5 shrink-0 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364L6.002 13.5a4.5 4.5 0 006.364 6.364l4.5-4.5a4.5 4.5 0 001.242-7.244" />
                        </svg>
                      )}
                      <span className="text-sm text-primary-700 dark:text-primary-300 truncate">
                        {getItemTitle(item)}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-medium text-green-600 dark:text-green-400">
                    {item.status === 'pushed' ? 'Pushed' : 'Skipped'}
                  </span>
                </div>
              ))}

              {/* Queued items — draggable */}
              {orderedQueuedItems.map((item, qIdx) => (
                <div
                  key={item.id}
                  draggable={!isCompleted && !isPaused}
                  onDragStart={() => handleDragStart(queue.id, item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDrop={() => handleDrop(queue.id, items)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 px-4 py-2.5 ${
                    (nonQueuedItems.length > 0 || qIdx > 0) ? 'border-t border-primary-50 dark:border-primary-800/50' : ''
                  } ${!isCompleted && !isPaused ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  {/* Drag handle + position number */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {!isCompleted && !isPaused && (
                      <svg className="h-3.5 w-3.5 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                      </svg>
                    )}
                    <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary-300 dark:border-primary-600">
                      <span className="text-[8px] font-bold text-primary-400">{qIdx + 1}</span>
                    </div>
                  </div>

                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.item_type === 'worksheet' ? (
                        <svg className="h-3.5 w-3.5 shrink-0 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      ) : (
                        <svg className="h-3.5 w-3.5 shrink-0 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364L6.002 13.5a4.5 4.5 0 006.364 6.364l4.5-4.5a4.5 4.5 0 001.242-7.244" />
                        </svg>
                      )}
                      <span className="text-sm text-primary-700 dark:text-primary-300 truncate">
                        {getItemTitle(item)}
                      </span>
                    </div>
                  </div>

                  {/* Actions for queued items */}
                  {!isCompleted && !isPaused && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveItem(queue.id, items, item.id, 'up')}
                        disabled={qIdx === 0}
                        className="rounded p-1 text-primary-400 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-30 transition-colors"
                        title="Move up"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveItem(queue.id, items, item.id, 'down')}
                        disabled={qIdx === orderedQueuedItems.length - 1}
                        className="rounded p-1 text-primary-400 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-30 transition-colors"
                        title="Move down"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleSkip(item.id)}
                        disabled={actionLoading === `skip-${item.id}`}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-primary-400 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-50 transition-colors"
                        title="Skip this item"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer actions */}
            {!isCompleted && (
              <div className="border-t border-primary-100 dark:border-primary-800 p-3 flex items-center gap-2">
                {!isPaused && orderedQueuedItems.length > 0 && (
                  <button
                    onClick={() => handlePush(queue.id)}
                    disabled={actionLoading === `push-${queue.id}`}
                    className="flex items-center gap-1.5 rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-900 transition-colors disabled:opacity-50 dark:bg-primary-700 dark:hover:bg-primary-600"
                  >
                    {actionLoading === `push-${queue.id}` ? (
                      'Pushing...'
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        Push next
                      </>
                    )}
                  </button>
                )}

                {isPaused ? (
                  <button
                    onClick={() => handleResume(queue.id)}
                    disabled={actionLoading === `resume-${queue.id}`}
                    className="flex items-center gap-1.5 rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-900 transition-colors disabled:opacity-50 dark:bg-primary-700 dark:hover:bg-primary-600"
                  >
                    {actionLoading === `resume-${queue.id}` ? 'Resuming...' : 'Resume'}
                  </button>
                ) : (
                  <button
                    onClick={() => handlePause(queue.id)}
                    disabled={actionLoading === `pause-${queue.id}`}
                    className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 dark:border-primary-700 dark:text-primary-400"
                  >
                    {actionLoading === `pause-${queue.id}` ? 'Pausing...' : 'Pause'}
                  </button>
                )}

                {/* Settings toggle */}
                <button
                  onClick={() => setSettingsOpenId(settingsOpenId === queue.id ? null : queue.id)}
                  className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors dark:border-primary-700 dark:text-primary-400"
                >
                  Settings
                </button>

                {/* Delete */}
                {deleteConfirmId === queue.id ? (
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={() => handleDelete(queue.id)}
                      disabled={actionLoading === `delete-${queue.id}`}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `delete-${queue.id}` ? 'Deleting...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-500 hover:bg-primary-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(queue.id)}
                    className="ml-auto rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}

            {/* Settings panel (collapsible) */}
            {settingsOpenId === queue.id && !isCompleted && (
              <SettingsPanel
                queue={queue}
                loading={actionLoading === `settings-${queue.id}`}
                onSave={(pushMode, intervalDays) => handleUpdateSettings(queue.id, pushMode, intervalDays)}
                onClose={() => setSettingsOpenId(null)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// --------------------------------------------------------------------------
// Settings sub-component
// --------------------------------------------------------------------------

function SettingsPanel({
  queue,
  loading,
  onSave,
  onClose,
}: {
  queue: PlanQueue
  loading: boolean
  onSave: (pushMode: PlanQueuePushMode, intervalDays: number) => void
  onClose: () => void
}) {
  const [pushMode, setPushMode] = useState<PlanQueuePushMode>(queue.push_mode)
  const [intervalDays, setIntervalDays] = useState(queue.auto_push_interval_days)

  return (
    <div className="border-t border-primary-100 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-800/20 p-4 space-y-3">
      <h4 className="text-xs font-semibold text-primary-600 dark:text-primary-400">Queue Settings</h4>
      <div>
        <label className="block text-xs text-primary-500 mb-1">Push mode</label>
        <select
          value={pushMode}
          onChange={(e) => setPushMode(e.target.value as PlanQueuePushMode)}
          className="w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 dark:border-primary-700 dark:text-primary-100"
        >
          <option value="manual">Manual only</option>
          <option value="time_based">Auto-push every N days</option>
          <option value="completion_based">Auto-push when homework completed</option>
          <option value="both">Both (time-based + completion)</option>
        </select>
      </div>
      {(pushMode === 'time_based' || pushMode === 'both') && (
        <div>
          <label className="block text-xs text-primary-500 mb-1">Push interval</label>
          <select
            value={intervalDays}
            onChange={(e) => setIntervalDays(Number(e.target.value))}
            className="w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 dark:border-primary-700 dark:text-primary-100"
          >
            <option value={3}>Every 3 days</option>
            <option value={7}>Every 7 days</option>
            <option value={14}>Every 14 days</option>
            <option value={30}>Every 30 days</option>
          </select>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSave(pushMode, intervalDays)}
          disabled={loading}
          className="rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-900 transition-colors disabled:opacity-50 dark:bg-primary-700 dark:hover:bg-primary-600"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-500 hover:bg-primary-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

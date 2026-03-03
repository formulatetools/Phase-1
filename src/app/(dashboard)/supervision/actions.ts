'use server'

// Re-export shim — all supervision actions now live in clients/actions.ts
// This file exists to prevent broken imports during migration.
// Turbopack doesn't support re-exporting from other 'use server' modules,
// so each function is a thin wrapper that delegates to the canonical action.

import {
  createSupervisee as _createSupervisee,
  updateSuperviseeLabel as _updateSuperviseeLabel,
  endSupervision as _endSupervision,
  reactivateSupervisee as _reactivateSupervisee,
  createSupervisionAssignment as _createSupervisionAssignment,
  lockSupervisionAssignment as _lockSupervisionAssignment,
  markSupervisionReviewed as _markSupervisionReviewed,
  markSupervisionPaperCompleted as _markSupervisionPaperCompleted,
  gdprEraseSupervision as _gdprEraseSupervision,
} from '@/app/(dashboard)/clients/actions'

export async function createSupervisee(...args: Parameters<typeof _createSupervisee>) {
  return _createSupervisee(...args)
}

export async function updateSuperviseeLabel(...args: Parameters<typeof _updateSuperviseeLabel>) {
  return _updateSuperviseeLabel(...args)
}

export async function endSupervision(...args: Parameters<typeof _endSupervision>) {
  return _endSupervision(...args)
}

export async function reactivateSupervisee(...args: Parameters<typeof _reactivateSupervisee>) {
  return _reactivateSupervisee(...args)
}

export async function createSupervisionAssignment(...args: Parameters<typeof _createSupervisionAssignment>) {
  return _createSupervisionAssignment(...args)
}

export async function lockSupervisionAssignment(...args: Parameters<typeof _lockSupervisionAssignment>) {
  return _lockSupervisionAssignment(...args)
}

export async function markSupervisionReviewed(...args: Parameters<typeof _markSupervisionReviewed>) {
  return _markSupervisionReviewed(...args)
}

export async function markSupervisionPaperCompleted(...args: Parameters<typeof _markSupervisionPaperCompleted>) {
  return _markSupervisionPaperCompleted(...args)
}

export async function gdprEraseSupervision(...args: Parameters<typeof _gdprEraseSupervision>) {
  return _gdprEraseSupervision(...args)
}

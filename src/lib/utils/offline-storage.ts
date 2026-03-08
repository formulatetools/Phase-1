/**
 * IndexedDB helper for persisting homework form state offline.
 *
 * Stores in-progress form values keyed by assignment token so that
 * if the page is refreshed or the browser is offline, the client's
 * work isn't lost.
 *
 * Database: formulate-offline
 * Object store: homework-drafts
 * Key: assignment token
 * Value: { values, savedAt, worksheetTitle }
 */

const DB_NAME = 'formulate-offline'
const DB_VERSION = 1
const STORE_NAME = 'homework-drafts'

interface HomeworkDraft {
  token: string
  values: Record<string, unknown>
  savedAt: number
  worksheetTitle: string
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'token' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Save form state to IndexedDB.
 * Call this on every auto-save alongside the API call.
 */
export async function saveFormState(
  token: string,
  values: Record<string, unknown>,
  worksheetTitle: string
): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const draft: HomeworkDraft = {
      token,
      values,
      savedAt: Date.now(),
      worksheetTitle,
    }

    store.put(draft)

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => {
        db.close()
        reject(tx.error)
      }
    })
  } catch {
    // IndexedDB not available (e.g. private browsing in some browsers)
    // Silently ignore — this is a best-effort enhancement
  }
}

/**
 * Load saved form state from IndexedDB.
 * Returns null if no draft exists for this token.
 */
export async function loadFormState(
  token: string
): Promise<{ values: Record<string, unknown>; savedAt: number; worksheetTitle: string } | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.get(token)

      request.onsuccess = () => {
        db.close()
        const result = request.result as HomeworkDraft | undefined
        if (result) {
          resolve({
            values: result.values,
            savedAt: result.savedAt,
            worksheetTitle: result.worksheetTitle,
          })
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        db.close()
        reject(request.error)
      }
    })
  } catch {
    return null
  }
}

/**
 * Clear saved form state from IndexedDB (after successful submission).
 */
export async function clearFormState(token: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    store.delete(token)

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => {
        db.close()
        reject(tx.error)
      }
    })
  } catch {
    // Silently ignore
  }
}

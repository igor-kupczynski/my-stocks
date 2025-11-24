/**
 * Simple foreground refresher utility.
 *
 * Starts by invoking the callback immediately, then schedules it to run
 * periodically every `intervalMs` while the returned disposer is not called.
 *
 * IMPORTANT: To avoid background refresh, always call the returned disposer
 * from your component's cleanup (e.g., useEffect return function).
 */
export function startRefresher(callback: () => void, intervalMs: number): () => void {
  // call immediately on start
  callback();
  const id = setInterval(() => {
    try {
      callback();
    } catch {
      // swallow to keep interval running; errors should be handled in callback
    }
  }, intervalMs);
  return () => clearInterval(id);
}

// Realtime fires one event per changed row, so completing several orders at
// once (or a single completion, which also touches other rows) would start a
// full refetch per event in every open subscription and flood the app. This
// coalesces a burst of events into one refetch, and drops a response that
// lands after a newer refetch started, so stale data (e.g. an order that was
// just completed showing up as open again) never overwrites fresh data.
const LIVE_REFETCH_DEBOUNCE_MS = 300;

export function createLiveRefetch<T>(
  load: () => Promise<T>,
  onChange: (value: T) => void | Promise<void>,
  onError: (error: unknown) => void,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let latestRequestId = 0;
  let stopped = false;

  const run = async () => {
    const requestId = ++latestRequestId;
    try {
      const value = await load();
      if (stopped || requestId !== latestRequestId) return;
      await onChange(value);
    } catch (error) {
      if (stopped || requestId !== latestRequestId) return;
      onError(error);
    }
  };

  return {
    // Initial fetch: runs right away.
    now() {
      void run();
    },
    // Realtime event: runs once the burst has settled.
    schedule() {
      if (stopped) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void run();
      }, LIVE_REFETCH_DEBOUNCE_MS);
    },
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}

export function guardAsync<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
) {
  let pending: Promise<Result> | null = null;

  return (...args: Args): Promise<Result> => {
    if (pending) {
      return pending;
    }

    pending = fn(...args).finally(() => {
      pending = null;
    });

    return pending;
  };
}

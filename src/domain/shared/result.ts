export type Result<T, E> = { kind: "ok"; value: T } | { kind: "err"; error: E };

export function ok<T, E>(value: T): Result<T, E> {
  return { kind: "ok", value };
}

export function err<T, E>(error: E): Result<T, E> {
  return { kind: "err", error };
}

export async function fromPromise<T>(
  fn: () => Promise<T>,
  errorMessage: string,
): Promise<Result<T, string>> {
  try {
    const value = await fn();
    return ok(value);
  } catch (e) {
    return err(e instanceof Error ? e.message : errorMessage);
  }
}

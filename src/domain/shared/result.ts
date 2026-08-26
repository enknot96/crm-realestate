export type Result<T, E> = { kind: "ok"; value: T } | { kind: "err"; error: E };

export function ok<T, E>(value: T): Result<T, E> {
  return { kind: "ok", value };
}

export function err<T, E>(error: E): Result<T, E> {
  return { kind: "err", error };
}

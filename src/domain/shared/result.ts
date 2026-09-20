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
    // 実際の例外(DBドライバの生SQL等)はサーバー側のログにだけ残す
    // 画面には常に呼び出し元が渡した日本語メッセージを返す
    console.error(errorMessage, e);
    return err(errorMessage);
  }
}

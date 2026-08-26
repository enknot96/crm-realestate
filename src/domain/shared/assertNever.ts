// 将来ユニオン型に新しいケースが増えたときの安全網をつくる
export function assertNever(value: never): never {
  throw new Error(`予期しない値です：${JSON.stringify(value)}`);
}

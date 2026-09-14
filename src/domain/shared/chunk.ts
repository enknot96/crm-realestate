// 配列を size 件ずつの配列に分割する。LINE の multicast API が1回につき最大500件までしか
// 宛先を受け付けない、といった「まとめて送れる上限」がある呼び出しの分割に使う。
// LINE等の外部APIには依存しない、純粋なユーティリティ。
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

import { PhotoStorage } from "@/domain/report/photoStorage";
import { ok } from "@/domain/shared/result";

// DEMO_MODE用
// R2には実際に保存せず、呼び出し内容をメモリに記録するだけの実装
export interface FakePhotoStorage extends PhotoStorage {
  readonly uploaded: ReadonlyMap<string, Buffer>;
}

export function createFakePhotoStorage(): FakePhotoStorage {
  const uploaded = new Map<string, Buffer>();

  return {
    uploaded,
    async upload(key, body) {
      uploaded.set(key, body);
      return ok(undefined);
    },
  };
}

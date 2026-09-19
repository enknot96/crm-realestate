import { PhotoStorage, StoredPhoto } from "@/domain/report/photoStorage";
import { err, ok } from "@/domain/shared/result";

// DEMO_MODE用
// R2には実際に保存せず、呼び出し内容をメモリに記録するだけの実装
export interface FakePhotoStorage extends PhotoStorage {
  readonly uploaded: ReadonlyMap<string, StoredPhoto>;
}

export function createFakePhotoStorage(): FakePhotoStorage {
  const uploaded = new Map<string, StoredPhoto>();

  return {
    uploaded,
    async upload(key, body, contentType) {
      uploaded.set(key, { body, contentType });
      return ok(undefined);
    },
    async download(key) {
      const stored = uploaded.get(key);
      if (!stored) {
        return err("写真が見つかりませんでした");
      }
      return ok(stored);
    },
  };
}

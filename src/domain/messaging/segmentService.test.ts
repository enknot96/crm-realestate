import { describe, it, expect } from "vitest";
import { resolveSegmentLineUserIds } from "./segmentService";
import { SegmentRepository } from "./segmentRepository";
import { LineUserId, TagId } from "../shared/branded";
import { ok, err } from "../shared/result";

function createFakeRepository(lineUserIds: LineUserId[]): SegmentRepository {
  return {
    listLineUserIdsByTagId: async () => ok(lineUserIds),
  };
}

function createFailingFakeRepository(message: string): SegmentRepository {
  return {
    listLineUserIdsByTagId: async () => err(message),
  };
}

describe("resolveSegmentLineUserIds", () => {
  const sellerTagId = 1 as TagId;

  it("タグに紐づくLINEユーザーID一覧を返す", async () => {
    const userIds = ["U1", "U2"] as LineUserId[];
    const result = await resolveSegmentLineUserIds(createFakeRepository(userIds), sellerTagId);

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value).toEqual(userIds);
    }
  });

  it("該当する顧客がいない場合は空配列を返す", async () => {
    const result = await resolveSegmentLineUserIds(createFakeRepository([]), sellerTagId);

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value).toEqual([]);
    }
  });

  it("リポジトリが重複したLINEユーザーIDを返しても、重複を除いて返す", async () => {
    const userIds = ["U1", "U2", "U1"] as LineUserId[];
    const result = await resolveSegmentLineUserIds(createFakeRepository(userIds), sellerTagId);

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value).toEqual(["U1", "U2"]);
    }
  });

  it("リポジトリの取得に失敗した場合はエラーを返す", async () => {
    const result = await resolveSegmentLineUserIds(
      createFailingFakeRepository("DB接続エラー"),
      sellerTagId,
    );

    expect(result.kind).toBe("err");
    if (result.kind === "err") {
      expect(result.error.kind).toBe("repository");
      if (result.error.kind === "repository") {
        expect(result.error.message).toBe("DB接続エラー");
      }
    }
  });
});

import { describe, it, expect } from "vitest";
import { Tag, TagRepository } from "../tag/repository";
import { TagId } from "../shared/branded";
import { resolveTag } from "./resolveTag";
import { ok, err } from "../shared/result";

function notImplemented(): never {
  throw new Error("この操作はテストで使用しない想定です");
}

function createFakeTagRepository(tags: Tag[]): TagRepository {
  return {
    list: async () => ok(tags),
    findById: async (id) => ok(tags.find((t) => t.id === id) ?? null),
    create: notImplemented,
    remove: notImplemented,
  };
}

function createFailingFakeTagRepository(message: string): TagRepository {
  return {
    list: notImplemented,
    findById: async () => err(message),
    create: notImplemented,
    remove: notImplemented,
  };
}

const sellerTag: Tag = { id: 1 as TagId, name: "売主" };

describe("resolveTag", () => {
  it("存在するタグをokで返す", async () => {
    const result = await resolveTag(createFakeTagRepository([sellerTag]), sellerTag.id);

    expect(result).toEqual(ok(sellerTag));
  });

  it("存在しないタグはtagNotFoundを返す", async () => {
    const result = await resolveTag(createFakeTagRepository([sellerTag]), 999 as TagId);

    expect(result).toEqual(err({ kind: "tagNotFound" }));
  });

  it("リポジトリの取得に失敗した場合はrepositoryエラーを返す", async () => {
    const result = await resolveTag(createFailingFakeTagRepository("DB接続エラー"), sellerTag.id);

    expect(result).toEqual(err({ kind: "repository", message: "DB接続エラー" }));
  });
});

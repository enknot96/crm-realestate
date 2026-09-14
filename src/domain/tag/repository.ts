import { TagId } from "../shared/branded";
import { Result } from "../shared/result";

export type Tag = {
  id: TagId;
  name: string;
};

export interface TagRepository {
  list(): Promise<Result<Tag[], string>>;
  // idが存在しない場合はnullを返す（エラーではない）
  findById(id: TagId): Promise<Result<Tag | null, string>>;
  create(name: string): Promise<Result<Tag, string>>;
  remove(id: TagId): Promise<Result<void, string>>;
}

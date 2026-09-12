import { TagId } from "../shared/branded";
import { Result } from "../shared/result";

export type Tag = {
  id: TagId;
  name: string;
};

export interface TagRepository {
  list(): Promise<Result<Tag[], string>>;
  create(name: string): Promise<Result<Tag, string>>;
  remove(id: TagId): Promise<Result<void, string>>;
}

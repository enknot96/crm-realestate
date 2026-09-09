import { LineUserId } from "../shared/branded";
import { Result } from "../shared/result";

export type LineFriend = {
  lineUserId: LineUserId;
  displayName: string;
  followedAt: Date;
  blockedAt: Date | null;
};

export interface LineFriendRepository {
  // 未紐付けの友だちを一覧表示する
  findUnlinked(): Promise<Result<LineFriend[], string>>;
}

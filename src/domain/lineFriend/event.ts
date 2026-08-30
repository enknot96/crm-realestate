import { LineUserId } from "@/domain/shared/branded";

export type LineFriendEvent =
  | { kind: "followed"; lineUserId: LineUserId; displayName: string; followedAt: Date } // 初めての友だち追加
  | { kind: "unblocked"; lineUserId: LineUserId; displayName: string; followedAt: Date } // ブロック解除による再追加（isUnblocked: true のとき）
  | { kind: "blocked"; lineUserId: LineUserId; blockedAt: Date } // ブロックされた（unfollowイベント）
  | { kind: "ignored" }; // それ以外

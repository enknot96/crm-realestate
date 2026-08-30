import { LineUserId } from "@/domain/shared/branded";

export type LineFriendEvent =
  | { kind: "followed"; lineUserId: LineUserId; displayName: string; followedAt: Date }
  | { kind: "blocked"; lineUserId: LineUserId; blockedAt: Date }
  | { kind: "ignored" };

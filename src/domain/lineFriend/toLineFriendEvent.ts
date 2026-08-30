import type { webhook } from "@line/bot-sdk";
import type { LineUserId } from "@/domain/shared/branded";
import type { LineFriendEvent } from "./event";

// 生のLINEイベントを LineFriendEvent に変換する関数

export function toLineFriendEvent(event: webhook.Event, displayName?: string): LineFriendEvent {
  switch (event.type) {
    // followイベントが起きた場合の処理
    case "follow": {
      // userId = その人が使っているLINEアカウントに紐づく一意の識別番号（LineUserIdとして扱いたいもの）
      const userId = event.source?.type === "user" ? event.source.userId : undefined;
      if (!userId || !displayName) {
        return { kind: "ignored" };
      }
      // ここまでで... 個人ユーザーからのfollowイベントで、
      // かつ userId と displayName が両方揃っている場合だけ処理を続ける
      // フォローされた という出来事は同じ follow イベントとして届くが、2パターンある
      if (event.follow.isUnblocked) {
        // isUnblocked（= {kind: unblocked}）：ブロック解除によって発生
        return {
          kind: "unblocked",
          lineUserId: userId as LineUserId,
          displayName,
          followedAt: new Date(event.timestamp),
        };
      }
      return {
        // 純粋な新規フォロー
        kind: "followed",
        lineUserId: userId as LineUserId,
        displayName,
        followedAt: new Date(event.timestamp),
      };
    }
    // ブロックされた時の処理 unfollow = ブロックされた
    // ユーザーが公式アカウントとの関係を断つ方法は「ブロックする」の1つだけ
    case "unfollow": {
      const userId = event.source?.type === "user" ? event.source.userId : undefined;
      if (!userId) {
        return { kind: "ignored" };
      }
      return {
        kind: "blocked",
        lineUserId: userId as LineUserId,
        blockedAt: new Date(event.timestamp),
      };
    }
    default:
      return { kind: "ignored" };
  }
}

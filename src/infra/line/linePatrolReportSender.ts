import { messagingApi } from "@line/bot-sdk";
import { chunk } from "@/domain/shared/chunk";
import { PatrolReportMessageSender } from "@/domain/report/patrolReportMessageSender";
import { fromPromise } from "@/domain/shared/result";

// LINEのpushMessageは1回のリクエストにつき最大5メッセージ(テキスト+画像を合わせて)
const PUSH_MESSAGE_CHUNK_SIZE = 5;

export type PushClient = Pick<messagingApi.MessagingApiClient, "pushMessage">;

export function createLinePatrolReportSender(client: PushClient): PatrolReportMessageSender {
  return {
    sendReport: (permit, userId, body, photoUrls) => {
      return fromPromise(async () => {
        // QuotaGuard.reserve()を経由した呼び出しであることを型で強制するために引数として要求
        void permit;

        const messages: messagingApi.Message[] = [
          { type: "text", text: body },
          ...photoUrls.map(
            (url): messagingApi.Message => ({
              type: "image",
              originalContentUrl: url,
              previewImageUrl: url,
            }),
          ),
        ];

        for (const messageChunk of chunk(messages, PUSH_MESSAGE_CHUNK_SIZE)) {
          await client.pushMessage({ to: userId, messages: messageChunk });
        }
      }, "LINEへの送信に失敗しました");
    },
  };
}

export function createLinePatrolReportSenderFromAccessToken(
  channelAccessToken: string,
): PatrolReportMessageSender {
  const client = new messagingApi.MessagingApiClient({ channelAccessToken });
  return createLinePatrolReportSender(client);
}

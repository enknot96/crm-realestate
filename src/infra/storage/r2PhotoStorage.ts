import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PhotoStorage } from "@/domain/report/photoStorage";
import { fromPromise } from "@/domain/shared/result";

export function createR2PhotoStorage(config: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}): PhotoStorage {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return {
    upload: (key, body, contentType) => {
      return fromPromise(async () => {
        await client.send(
          new PutObjectCommand({
            Bucket: config.bucketName,
            Key: key,
            Body: body,
            ContentType: contentType,
          }),
        );
      }, "写真の保存に失敗しました");
    },
    download: (key) => {
      return fromPromise(async () => {
        const response = await client.send(
          new GetObjectCommand({ Bucket: config.bucketName, Key: key }),
        );
        if (!response.Body) {
          throw new Error("写真が見つかりませんでした");
        }
        const bytes = await response.Body.transformToByteArray();
        return {
          body: Buffer.from(bytes),
          contentType: response.ContentType ?? "application/octet-stream",
        };
      }, "写真の取得に失敗しました");
    },
  };
}

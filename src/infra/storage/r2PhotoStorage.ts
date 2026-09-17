import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
  };
}

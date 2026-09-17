import sharp from "sharp";

// EXIF除去（画像ファイルに含まれる撮影日時や場所、スマホの機種情報等のメタデータ）
// 意図は容量削減ではなく、プライバシー・セキュリティ対策
export async function stripExif(input: Buffer): Promise<Buffer> {
  return sharp(input).rotate().toBuffer();
}

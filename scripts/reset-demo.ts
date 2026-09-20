// GitHub Actions(.github/workflows/reset-demo.yml)から日次で呼ばれる
// 翌日には必ずseed直後の状態に戻る、という運用を保証
// 使い方: pnpm reset-demo
import { seedDemoData } from "./seedDemoData";

seedDemoData()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

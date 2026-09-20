// 使い方: pnpm seed
import { seedDemoData } from "./seedDemoData";

seedDemoData()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

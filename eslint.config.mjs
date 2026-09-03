import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // 仕様書6章: 依存方向の強制(src/domainはReact/Nextを知らない、src/appはsrc/infraを直接呼ばない)
  // "import" プラグイン自体は eslint-config-next(core-web-vitals) が既に登録済みのため、ここでは再登録しない。
  {
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/domain/**/*",
              from: ["./src/app/**/*", "./src/infra/**/*"],
              message:
                "src/domain は src/app・src/infra に依存できません。ドメインロジックはNext.jsから独立させること。",
            },
            {
              target: "./src/app/**/*",
              from: "./src/infra/**/*",
              message:
                "src/app から src/infra を直接呼べません。必ず src/domain のユースケース経由にすること。",
            },
          ],
        },
      ],
    },
  },
  // route.ts/actions.tsは合成ルート(domainのユースケース関数に、infraの実装(例: drizzleCustomerRepository)を
  // 引数として渡して呼び出す場所)として、infraの直接importを許可する。
  // Phase2でRepositoryパターン+DIを導入したことで、ここが「domainとinfraをつなぐ唯一の場所」という正式な役割になった。
  {
    files: ["src/app/**/route.ts", "src/app/**/actions.ts"],
    rules: {
      "import/no-restricted-paths": "off",
    },
  },
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", message: "src/domain は React に依存しない設計にすること。" },
            { name: "react-dom", message: "src/domain は React に依存しない設計にすること。" },
          ],
          patterns: [
            {
              group: ["next", "next/*"],
              message: "src/domain は Next.js に依存しない設計にすること。",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;

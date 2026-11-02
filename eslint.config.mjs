import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // useEffect is treated as an anti-pattern here: derive state during render,
    // fetch in event handlers / server components, and use ref callbacks for cleanup.
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.name=/^use(Layout)?Effect$/], CallExpression[callee.property.name=/^use(Layout)?Effect$/]",
          message:
            "useEffect is an anti-pattern in this app. Derive state in render, handle work in event handlers, fetch in Server Components, or use ref callbacks.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

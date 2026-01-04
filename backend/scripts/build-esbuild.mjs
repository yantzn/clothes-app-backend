/**
 * esbuild バンドルスクリプト
 * 目的:
 *  - Lambda の Node.js ESM 実行で発生する「拡張子なし相対 import を解決できない」問題を根本解決するため、
 *    依存関係を 1 ファイル（もしくは少数）にバンドルして実行時解決を不要化する。
 *  - デプロイ物のサイズ削減とコールドスタート短縮（node_modules 同梱を不要化）。
 * 実行タイミング:
 *  - npm run build（package.json）から、tsc --noEmit による型検査の後に実行される。
 * 出力とハンドラー:
 *  - 出力: dist/handlers/express.js
 *  - Lambda ハンドラー指定: dist/handlers/express.handler（export 名: handler）
 */
import esbuild from "esbuild";

await esbuild.build({
  // Lambda のエントリーポイント（export const handler が存在）
  entryPoints: ["src/handlers/express.ts"],
  // 依存を 1 出力にまとめ、相対 import/拡張子解決の揺れを排除
  bundle: true,
  // Node.js ランタイム向けに最適化（ポリフィル不要・組み込みは外部扱い）
  platform: "node",
  // Node.js 22 が理解できる構文にする（最新構文を保ちつつ互換性担保）
  target: "node22",
  // 出力を ESM として生成（ZIP ルートの package.json の "type": "module" と整合）
  format: "esm",
  // Lambda が参照する出力ファイル（ハンドラー: dist/handlers/express.handler）
  outfile: "dist/handlers/express.js",
  // デバッグ容易性のためのソースマップ（CloudWatch ログの逆引き等）
  sourcemap: true,
  // ZIP/展開サイズを縮小しコールドスタートを改善
  minify: true,
  // 余分なライセンスコメントを出力に残さない
  legalComments: "none",
});

console.log("esbuild: bundled handler to dist/handlers/express.js");

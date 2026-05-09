/**
 * npm が古い Node（Cursor 同梱など）でスクリプトを動かすと vite バイナリが ERR_REQUIRE_ESM になる。
 * 先にバージョンを見て、足りなければ対処法を表示して終了する。
 */
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function needNode() {
  const major = Number(process.versions.node.split(".")[0]);
  if (Number.isFinite(major) && major >= 18) return null;
  const win = process.platform === "win32";
  const hint = win
    ? `次のいずれかを試してください。
  1) プロジェクトの web フォルダで: .\\dev.ps1
  2) このセッションだけ PATH を先頭に足す:
     $env:PATH = "${"C:\\\\Program Files\\\\nodejs"};" + $env:PATH
     npm run dev
  3) Windows Terminal など Cursor 以外のターミナルで Node 20+ を使う`
    : `Node 18 以上を PATH の先頭にしてください（nvm / fnm など）。`;
  return `[murder-mystery-web] Node 18+ が必要ですが、現在は ${process.version} です。

${hint}

詳細: https://nodejs.org/`;
}

const err = needNode();
if (err) {
  console.error(err);
  process.exit(1);
}

async function main() {
  const { createServer } = await import("vite");
  const server = await createServer({
    configFile: path.join(root, "vite.config.mjs"),
    root,
  });
  await server.listen();
  server.printUrls();
  server.bindCLIShortcuts({ print: true });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

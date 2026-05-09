import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const major = Number(process.versions.node.split(".")[0]);
if (!Number.isFinite(major) || major < 18) {
  console.error(
    `[murder-mystery-web] Node 18+ が必要ですが、現在は ${process.version} です。`,
  );
  process.exit(1);
}

async function main() {
  const { preview } = await import("vite");
  const previewServer = await preview({
    configFile: path.join(root, "vite.config.mjs"),
    root,
  });
  previewServer.printUrls();
  previewServer.bindCLIShortcuts({ print: true });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

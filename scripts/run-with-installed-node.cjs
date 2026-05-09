/**
 * npm が Cursor 同梱などの古い Node で動いても読めるよう、構文は ES5 互換にしている。
 * 新しい Node のパスを探し、子プロセスで *.mjs を起動する。
 */
"use strict";

var spawnSync = require("child_process").spawnSync;
var fs = require("fs");
var path = require("path");

var root = path.join(__dirname, "..");
var targetName = process.argv[2];
var extraArgs = process.argv.slice(3);

if (!targetName) {
  console.error(
    "usage: node scripts/run-with-installed-node.cjs <script.mjs> [args...]",
  );
  process.exit(1);
}

function candidatesWin32() {
  var list = [];
  var pf = process.env.ProgramFiles;
  if (pf) list.push(path.join(pf, "nodejs", "node.exe"));
  var pf86 = process.env["ProgramFiles(x86)"];
  if (pf86) list.push(path.join(pf86, "nodejs", "node.exe"));
  var la = process.env.LOCALAPPDATA;
  if (la) list.push(path.join(la, "Programs", "nodejs", "node.exe"));
  return list;
}

function pickNodeExe() {
  if (process.platform === "win32") {
    var list = candidatesWin32();
    var i;
    for (i = 0; i < list.length; i++) {
      var c = list[i];
      if (c && fs.existsSync(c)) return c;
    }
  }
  return process.execPath;
}

function majorVersion(nodeExe) {
  var r = spawnSync(nodeExe, ["-p", "process.versions.node"], {
    encoding: "utf8",
  });
  if (r.status !== 0 || !r.stdout) return 0;
  var parts = String(r.stdout).trim().split(".");
  var major = parseInt(parts[0], 10);
  if (isNaN(major)) return 0;
  return major;
}

var nodeExe = pickNodeExe();
var maj = majorVersion(nodeExe);

if (maj < 18) {
  console.error(
    "[murder-mystery-web] Node.js 18+ required. Got major=" +
      maj +
      " at " +
      nodeExe +
      ". Install from https://nodejs.org (Windows: C:\\Program Files\\nodejs\\node.exe)",
  );
  process.exit(1);
}

var scriptPath = path.join(__dirname, targetName);
var args = [scriptPath].concat(extraArgs);
var result = spawnSync(nodeExe, args, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
var exitCode = result.status;
process.exit(typeof exitCode === "number" ? exitCode : 1);

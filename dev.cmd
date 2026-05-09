@echo off
setlocal
REM npm が古い node を使う場合の回避: インストール済み Node で run-dev.mjs を直接起動
cd /d "%~dp0"
set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if exist "%NODE_EXE%" goto RUN
if defined LOCALAPPDATA set "NODE_EXE=%LOCALAPPDATA%\Programs\nodejs\node.exe"
if exist "%NODE_EXE%" goto RUN
echo [murder-mystery-web] Node 18+ が見つかりません（通常は C:\Program Files\nodejs など）。
echo https://nodejs.org からインストールするか、npm run dev の前に PATH を通してください。
exit /b 1
:RUN
"%NODE_EXE%" "%~dp0scripts\run-dev.mjs" %*
exit /b %ERRORLEVEL%

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plain UTF-8 file, always in the Backend folder next to server.js.
// Writing here (instead of relying on console output) means what happened
// can always be inspected later regardless of which shell/terminal/OS
// encoding was used to start the process — PowerShell's `>` redirection,
// for instance, writes UTF-16 and garbles emoji, which cost real time to
// untangle while debugging this. This file is always plain, readable text.
const LOG_FILE = path.join(__dirname, "app.log");

export function log(...parts) {
  const line = `[${new Date().toISOString()}] ${parts
    .map((p) => (typeof p === "string" ? p : JSON.stringify(p, null, 0)))
    .join(" ")}`;

  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + "\n", "utf8");
  } catch {
    // Logging must never be the reason the app crashes.
  }
}

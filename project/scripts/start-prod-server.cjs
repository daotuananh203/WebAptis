const { spawn } = require("child_process");
const path = require("path");

process.env.NODE_ENV = "production";
process.env.ALLOW_MEMORY_STORE = "true";
const port = process.env.PORT || "3128";

console.log(`Starting Next.js Production Server on port ${port}...`);

const nextStart = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "start", "-p", port],
  {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    shell: true,
    env: process.env,
  }
);

nextStart.on("exit", (code) => {
  console.log(`Next.js production server exited with code ${code}`);
  process.exit(code || 0);
});

import fs from "fs";

const raw = fs.readFileSync(".env", "utf8");
const pwLine = raw.split("\n").find(l => l.startsWith("TEST_GUARDIAN_PASSWORD"));
if (pwLine) {
  const val = pwLine.slice(pwLine.indexOf("=") + 1);
  console.log("Raw value bytes:", [...val].map(c => `U+${c.charCodeAt(0).toString(16).padStart(4,"0")} (${c})`).join(" "));
}

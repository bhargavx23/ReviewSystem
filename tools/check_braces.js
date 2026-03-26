const fs = require("fs");
const path = require("path");
const p = path.join(
  __dirname,
  "..",
  "frontend",
  "src",
  "pages",
  "StudentDashboard.jsx",
);
const s = fs.readFileSync(p, "utf8");
const stack = [];
for (let i = 0; i < s.length; i++) {
  const c = s[i];
  if (c === "{") stack.push(i);
  else if (c === "}") {
    if (stack.length) stack.pop();
    else console.log("Extra closing } at", i);
  }
}
console.log("Unclosed { count:", stack.length);
if (stack.length) {
  const idx = stack[stack.length - 1];
  const lines = s.slice(0, idx).split("\n");
  const lineNum = lines.length;
  const all = s.split("\n");
  const start = Math.max(0, lineNum - 8);
  const end = Math.min(all.length, lineNum + 8);
  console.log("Last unclosed { at line", lineNum);
  console.log(
    all
      .slice(start, end)
      .map((l, i) => `${start + i + 1}: ${l}`)
      .join("\n"),
  );
}

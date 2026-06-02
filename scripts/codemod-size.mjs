import fs from "node:fs";
import path from "node:path";

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

let count = 0;
for (const file of walk("src")) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  content = content.replace(/\bh-(\d+(?:\.\d+)?)\s+w-\1\b/g, "size-$1");
  content = content.replace(/\bw-(\d+(?:\.\d+)?)\s+h-\1\b/g, "size-$1");
  if (content !== original) {
    fs.writeFileSync(file, content);
    count++;
  }
}
console.log(`Updated ${count} files`);

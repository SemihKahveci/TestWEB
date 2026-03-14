const fs = require("fs");
const path = require("path");

const nextDir = path.join(__dirname, "..", ".next");

try {
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("✓ .next cache temizlendi");
  } else {
    console.log("✓ .next cache zaten temiz");
  }
} catch (error) {
  console.warn("⚠ .next cache temizlenemedi:", error?.message || error);
}

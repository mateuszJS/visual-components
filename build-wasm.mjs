import { fileURLToPath } from "url"
import path from "path"
import { spawn } from "child_process"

function runProcess(bin, args, options) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, options)

    p.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error("Rust compilation."))
      }
    })

    p.on("error", reject)
  })
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
runProcess("wasm-pack", [
  "--verbose",
  "build",
  path.resolve(__dirname, "crate"),
  "--out-dir",
  path.resolve(__dirname, "crate", "pkg"),
  "--out-name",
  "index",
  "--target",
  "bundler",
])

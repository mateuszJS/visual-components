import wasm from "./pkg/index_bg.wasm"
export * from "./pkg/index_bg.js"
import * as index_bg from "./pkg/index_bg.js"

const base64Data = wasm.split("base64,")[1]
const wasmBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))

WebAssembly.instantiate(wasmBuffer, {'./index_bg.js':index_bg}).then(wasmModule => {
  index_bg.__wbg_set_wasm(wasmModule.instance.exports)
  wasmModule.instance.exports.__wbindgen_start()
})

import mat4 from "utils/mat4";
import captureStreamFromCanvas from "utils/captureCanvasStream";
// import captureStreamFromCanvasWasm from "utils/captureCanvasStreamWasm";
import vec3 from "utils/vec3";
import getCanvasRenderDescriptor from "getCanvasRenderDescriptor";
import { drawTexture } from "WebGPU/programs/initPrograms";
import { State } from "../crate/pkg";
import getCanvasMatrix from "getCanvasMatrix";

export let transformMatrix = new Float32Array()
export const MAP_BACKGROUND_SCALE = 1000

let stopRecording: VoidFunction | null = null
let samples = 0
let averageTime = 0

export default function runCreator(
  state: State,
  canvas: HTMLCanvasElement,
  context: GPUCanvasContext,
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  textures: GPUTexture[],
) {



  const matrix = getCanvasMatrix(canvas)

  function draw(now: DOMHighResTimeStamp) {
    // const { needsRefresh } = state; // make save copy of needsRefresh value
    // state.needsRefresh = false; // set next needsRefresh to false by default

    // if (needsRefresh) {
      const encoder = device.createCommandEncoder()
      const descriptor = getCanvasRenderDescriptor(context, device)
      const pass = encoder.beginRenderPass(descriptor)

      let isDone = false
      let i = 0
      while (!isDone) {
        const { texture_id, vertex_data } = state.get_shader_input(i)
        i++
        isDone = vertex_data.length === 0
        if (!isDone) {
          drawTexture(pass, matrix, new Float32Array(vertex_data), textures[texture_id])
        }
      }

      pass.end()
      const commandBuffer = encoder.finish();
      device.queue.submit([commandBuffer]);
    // }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

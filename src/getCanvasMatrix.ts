import mat4 from "utils/mat4";

export default function getCanvasMatrix(canvas: HTMLCanvasElement) {
  const matrix = mat4.ortho(
    0,                   // left
    canvas.clientWidth,  // right
    canvas.clientHeight, // bottom
    0,                   // top
    1,                 // near
    -1,                // far
  );  

  return matrix
}
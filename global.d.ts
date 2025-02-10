declare module "*.wgsl" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

interface Point {
  x: number;
  y: number;
}

type Line = [Point, Point];

interface HTMLInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}
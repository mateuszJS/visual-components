
import initCreator from "../src/index"

async function test() {
  const canvas = document.querySelector<HTMLCanvasElement>("canvas")!
  const creator = await initCreator(canvas)

  const fileInput = document.querySelector<HTMLInputElement>('input')!
  fileInput.addEventListener('change', (event) => {
    const { files } = (event.target as HTMLInputElement);
    if (!files) return;

    const img = new Image()
    img.src = URL.createObjectURL(files[0]);
    img.onload = (e) => {
      creator.addImage(img)
    };
  })

  let offset = 100
  const updateImgPositionBtn = document.querySelector<HTMLButtonElement>('#img-position')!
  updateImgPositionBtn.addEventListener('click', () => {
    creator.updatePoints(0, [
      { x: offset, y: offset },
      { x: offset + 400, y: offset },
      { x: offset + 400, y: offset + 400 },
      { x: offset, y: offset + 400 },
    ])
    offset += 10
  })
}

test()

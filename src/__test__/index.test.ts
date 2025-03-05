import initCreator from "../index"



describe("Magic-render, does it", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <canvas width="800" height="800"></canvas>
      <input type="file" />
    `
  })

  test("work?", () => {

    async function test() {
      const canvas = document.querySelector<HTMLCanvasElement>("canvas")
      if (!canvas) throw Error("Canvas has to be always provided")
      
      const creator = await initCreator(canvas)

      const fileInput = document.querySelector<HTMLInputElement>('input')!
      fileInput.addEventListener('change', (event) => {
        const { files } = (event.target as HTMLInputElement);
        if (!files) return;

        const img = new Image()
        img.src = URL.createObjectURL(files[0]);
        img.onload = (e) => {
          creator.addImage(img)

          let offset = 100
          setInterval(() => {
            creator.updatePoints(0, [
              { x: offset, y: offset },
              { x: offset + 400, y: offset },
              { x: offset + 400, y: offset + 400 },
              { x: offset, y: offset + 400 },
            ])
            offset += 10
          }, 100)
        };
      })

    }

    test()
    console.log(document)
    expect(1).toEqual(2)
  })
})
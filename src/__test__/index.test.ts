// import initCreator from "../index"


describe("Magic-render, does it", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <canvas width="800" height="800"></canvas>
      <input type="file" />
    `
  })

  test("work?", () => {
    expect(1).toEqual(1)
  })
})
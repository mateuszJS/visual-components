// import { getPreviewVideoSize } from "components/Preview";
import { MINI_SIZE, MS_PER_PIXEL, isMobile } from "consts"
import { attachSlice, createTextureArray } from "WebGPU/getTexture"

const MS_LIMIT_STUCK = 1000

interface FrameDetails {
  time: number;
  callback: VoidFunction;
  isFetching: boolean;
  cache: boolean;
}

const getDepthFromTime = (timeMs: number) =>
  Math.ceil(timeMs / MS_PER_PIXEL / MINI_SIZE)

export default class MiniatureVideo {
  private _width?: number
  private _height?: number
  private _duration?: number
  public html: HTMLVideoElement
  public isReady: boolean
  private requestedFrames: FrameDetails[]
  public textureArray: GPUTexture
  private fetchedFramesMs: number[]
  public isPlaying: boolean
  private texWidth: number
  private texHeight: number

  constructor(
    url: string,
    cbOnReady: (video: MiniatureVideo) => void,
    private getCurrTime: () => number,
    onVideoEnd: VoidFunction,
    private device: GPUDevice,
  ) {
    const html = document.createElement("video")
    this.isReady = false

    html.addEventListener("loadedmetadata", () => {
      this.isReady = true
      this._width = html.videoWidth
      this._height = html.videoHeight
      this._duration = html.duration * 1000

      // const { width, height } = getPreviewVideoSize(this);
      const width = 500
      const height = 500

      this.texWidth = width
      this.texHeight = height

      // startDate - Returns a Date object representing the current time offset

 
      const numberOfMiniatures = getDepthFromTime(this.duration)
      this.textureArray = createTextureArray(device, width, height, numberOfMiniatures)
      // this.textureArray = createTexture2dArrayFromSources(device, sourceBitmapsList, {flipY: true}),

      cbOnReady(this)

      if (isMobile) {
        /* fix, On mobile the event from requestVideoFrameCallback is not firing! Needs to call play() at least once
        without this fix a app is still working, but needs to firstly run into first setTimeout with html.play() inside */
        this.html.play()
        this.html.pause()
      }
    })
    this.texWidth = 0
    this.texHeight = 0

    this.textureArray = createTextureArray(device, 1, 1, 1) // just placeholder
    this.requestedFrames = []
    this.fetchedFramesMs = []
    this.isPlaying = false

    this.html = html
    this.html.addEventListener("ended", onVideoEnd)

    html.playsInline = true
    html.muted = true
    html.loop = false
    html.src = url
    html.preload = "auto"
  }

  set currTime(time: number) {
    this.html.currentTime = time / 1000
  }

  get currTime() {
    return this.html.currentTime * 1000
  }

  // returns duration of the video in ms
  get duration() {
    if (!this._duration) {
      throw Error(
        "Duration of the video is unknown! Wait for meta data to be loaded!"
      )
    }

    return this._duration
  }

  get width() {
    if (!this._width) {
      throw Error(
        "Width of the video is unknown! Wait for meta data to be loaded!"
      )
    }

    return this._width
  }

  get height() {
    if (!this._height) {
      throw Error(
        "Height of the video is unknown! Wait for meta data to be loaded!"
      )
    }

    return this._height
  }

  private requestVideoFrame(frameDetails: FrameDetails) {
    this.currTime = frameDetails.time
    let videoFrameCallbackId = 0

    const retry = () => {
      // sometimes requestVideoFrameCallback get stuck(tested on iPhone 13 Pro, chrome and safari)
      this.html.play().catch((err) => {
        // the sequence play() -> pause() -> play() can cause rejection of last play
      })
      this.requestVideoFrame(frameDetails) // not sure if we need to aks for another one
    }

    const timeoutId = setTimeout(() => {
      // TODO: shot loading screen
      this.html.cancelVideoFrameCallback(videoFrameCallbackId)
      if (this.isPlaying) {
        frameDetails.isFetching = false
        return
      }
      retry()
    }, MS_LIMIT_STUCK)

    // seems like requestVideoFrameCallback works only for very first tim download a frame
    videoFrameCallbackId = this.html.requestVideoFrameCallback(
      (now, metadata) => {
        clearTimeout(timeoutId)

        if (this.isPlaying) {
          frameDetails.isFetching = false
          return // we don't want to complicate code by
          // implementing canceling the currently attached requestVideoFrameCallback once video start playing, so
          // we will just avoid the effect of requestVideoFrameCallback
        }
        this.html.pause() // in retry() function we are playing video to avoid getting stuck, so we make pause here ot make sure it stops
        const frameTimeDiff = Math.abs(
          metadata.mediaTime - this.html.currentTime
        )
        if (frameTimeDiff > 0.1) {
          retry()
          return
        }

        this.requestedFrames = this.requestedFrames.filter(
          (frame) => frame.time !== frameDetails.time
        )

        if (frameDetails.cache) {
          this.fetchedFramesMs.push(frameDetails.time)
          const zOffset = getDepthFromTime(frameDetails.time) // make sure it's <0. Safari thrown error that sometimes it is less than 0
          attachSlice(this.device, this.textureArray, this.texWidth, this.texHeight, this.getVideoData(), zOffset)
          // do we need that this.getVideoData()
        }

        /* COPY PIXELS FROM CURRENT FRAME BUFFER INTO TEXTURE */
        // frameDetails.texture.fill(this.copyFBO);

        frameDetails.callback()

        if (this.requestedFrames.length > 0) {
          this.fetchNextFrame()
        }
      }
    )
  }

  private getVideoData() {
    const tmpCanvas = document.createElement("canvas")
    tmpCanvas.width = this.texWidth
    tmpCanvas.height = this.texHeight
    const ctx = tmpCanvas.getContext("2d")
    if (!ctx) throw Error("NO 2D CONTEXT FOR TEMPORAL CANVAS")
    ctx.drawImage(this.html, 0, 0, this.texWidth, this.texHeight)
    return tmpCanvas
  }

  private fetchNextFrame() {
    const currTime = this.getCurrTime()

    const frameDetails = this.requestedFrames.reduce((accFrame, frame) => {
      if (
        Math.abs(frame.time - currTime) < Math.abs(accFrame.time - currTime)
      ) {
        return frame
      }
      return accFrame
    })

    frameDetails.isFetching = true
    this.requestVideoFrame(frameDetails)
  }
  /* return true if request has been added to queue, so callback will be called in the future */
  private addFrameToQueue(
    msOffset: number,
    callback: VoidFunction,
    cache: boolean
  ): boolean {
    const alreadyRequested = this.requestedFrames.some(
      (frame) => frame.time === msOffset
    )

    if (alreadyRequested) return false
    this.requestedFrames.push({
      time: msOffset,
      callback,
      isFetching: false,
      cache,
    })

    return true
  }

  public triggerRequest() {
    if (this.isPlaying) return

    const isFetching = this.requestedFrames.some((frame) => frame.isFetching)
    if (this.requestedFrames.length > 0 && !isFetching) {
      this.fetchNextFrame() // it should be moved to the end of render. Only after a render there can be a new item here.
    }
  }

  /* return true if request has been added to queue, so callback will be called in the future */
  public requestFrame(
    msOffset: number,
    callback: VoidFunction,
    cache: boolean
  ): boolean {
    if (this.isPlaying) {
      return false // when video is playing we don't want to disrupt it with changing currentTime
    }

    if (!this.fetchedFramesMs.includes(msOffset)) {
      // preview render never asks for same time as cache, is just using cache in this case
      return this.addFrameToQueue(msOffset, callback, cache)
    }

    return false
  }

  public play(time: number) {
    this.currTime = time
    this.html.play()
    this.isPlaying = true
  }

  public pause = () => {
    this.html.pause()
    this.isPlaying = false
  }
}

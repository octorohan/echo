// NSFW Detection Worker
// Runs TensorFlow.js + NSFWJS inference entirely off the main thread.
// The main thread sends ImageBitmap frames via postMessage.
// This worker sends back a confidence score only — never the frame.
// The main thread hashes the score before sending anything to the server.

// Full model loading wired in during development phase.
// Placeholder structure here so TypeScript is satisfied.

let modelReady = false

self.onmessage = async (event: MessageEvent) => {
  const { type } = event.data

  if (type === 'init') {
    // TODO: import * as nsfwjs from 'nsfwjs'
    // TODO: model = await nsfwjs.load()
    modelReady = true
    self.postMessage({ type: 'ready' })
    return
  }

  if (type === 'classify') {
    if (!modelReady) return
    // TODO: const predictions = await model.classify(event.data.frame)
    // TODO: const score = predictions.find(p => p.className === 'Porn')?.probability ?? 0
    self.postMessage({ type: 'result', score: 0 }) // placeholder
    return
  }
}

export {}

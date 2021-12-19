import { Readable, Writable, Transform } from 'stream'

export default class TestUtil {
  static generateReadableStream(data) {
    return new Readable({
      async read() {
        for (const item of data) {
          this.push(item)
        }

        this.push(null)
      }
    })
  }

  static generateWritableStream(onData) {
    return new Writable({
      objectMode: true,
      write(chunk, enconding, callback) {
        onData(chunk)
        callback(null, chunk)
      }
    })
  }

  static generateTransformStream(onData) {
    return new Transform({
      objectMode: true,
      transform(chunk, enconding, callback) {
        onData(chunk)
        callback(null, chunk)
      }
    })
  }
}
import { dirname, resolve } from 'path'
import { pipeline } from 'stream/promises'
import { fileURLToPath, parse } from 'url'

import FileHelper from "./fileHelper.js"
import { logger } from "./logger.js"
import UploadHandler from './uploadHandler.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const defaultDownloadsFolder = resolve(__dirname, '../', 'downloads')

export default class Routes {
  io
  downloadsFolder

  constructor(downloadsFolder = defaultDownloadsFolder) {
    this.downloadsFolder = downloadsFolder
    this.fileHelper = FileHelper
  }

  setSocketInstance(io) {
    this.io = io
  }

  async defaultRoute(req, res) {
    res.end('hello world')
  }

  async options(req, res) {
    res.writeHead(204)
    res.end('hello world')
  }

  async post(req, res) {
    const { headers } = req
    const { query: { socketId } } = parse(req.url, true)
    const uploadHandler = new UploadHandler({
      socketId,
      io: this.io,
      downloadsFolder: this.downloadsFolder
    })

    const onFinish = (res) => () => {
      res.writeHead(200)
      const data = JSON.stringify({ result: 'File uploaded with success!' })
      res.end(data)
    }

    const busboyInstance = uploadHandler.registerEvents(headers, onFinish(res))

    await pipeline(
      req,
      busboyInstance
    )

    logger.info('Request finished with sucess')
  }

  async get(req, res) {
    const files = await this.fileHelper.getFileStatus(this.downloadsFolder)
    res.writeHead(200)
    res.end(JSON.stringify(files))
  }

  handler(req, res) {
    res.setHeader('Access-Control-Allow-Origon', '*')
    const chosen = this[req.method.toLowerCase()] || this.defaultRoute
    return chosen.apply(this, [req, res])
  }
}
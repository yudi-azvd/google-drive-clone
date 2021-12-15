import { logger } from "./logger.js"

export default class Routes {
  io

  constructor() {

  }

  setSocketInstance(io) {
    this.io = io 
  }

  async defaultRoute(req, res) {
    res.end('hello world')
  }

  async options(req, res) {
    res.writeHead(204)
    res.end('hellow world')
  }

  async post(req, res) {
    logger.info('/post from Routes')
    res.end()
  }

  async get(req, res) {
    logger.info('/get from Routes')
    res.end()
  }

  handler(req, res) {
    res.setHeader('Access-Control-Allow-Origon', '*')
    const chosen = this[req.method.toLowerCase()] || this.defaultRoute
    return chosen.apply(this, [req, res])
  }
}
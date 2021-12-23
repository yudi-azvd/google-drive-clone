export default class AppController {
  connectionManager

  constructor({ connectionManager }) {
    this.connectionManager = connectionManager
  }

  async initialize() {
    this.updateCurrentFiles()
  }

  async updateCurrentFiles() {
    const files = await this.connectionManager.currentFiles()
    console.log({ files })
  }
}
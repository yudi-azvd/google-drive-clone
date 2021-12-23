export default class ConnectionManager {
  apiUrl = ''

  constructor({ apiUrl }) {
    this.apiUrl = apiUrl
  }

  async currentFiles() {
    const files = (await (await fetch(this.apiUrl)).json())
    return files
  }
}
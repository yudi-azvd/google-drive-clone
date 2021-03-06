import fs from 'fs'
import https from 'https'
import { Server } from 'socket.io'

import { logger } from './logger.js'
import Routes from './routes.js'

const PORT = process.env.PORT || 3000

const localHostSSL = {
  key: fs.readFileSync('./certificates/key.pem'),
  cert: fs.readFileSync('./certificates/cert.pem'),
}


const routes = new Routes()
const server = https.createServer(
  localHostSSL,
  routes.handler.bind(routes)
)

const io = new Server(server,  {
  cors: {
    origin: '*',
    credentials: false
  }
})

io.on('connection', (socket) => logger.info(`someone connected: ${socket.id}`))
routes.setSocketInstance(io)

const startServer = () => {
  const { address, port } = server.address()
  console.log({address})
  logger.info(`app running at https://${address}:${port}`)
  logger.info(`hard coded link https://localhost:3000`)
}

server.listen(PORT, startServer)
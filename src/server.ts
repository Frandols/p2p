import express from 'express'
import http from 'http'
import path from 'path'
import { Server } from 'socket.io'
import { setupSocket } from './socket'

const app = express()
const server = http.createServer(app)
const io = new Server(server)

// Servir archivos estáticos desde la carpeta 'static'
app.use(express.static(path.join(__dirname, './static')))

// Configurar el manejo de sockets
type SocketIOType = typeof io
setupSocket(io as SocketIOType)

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
	console.log(`Servidor corriendo en http://localhost:${PORT}`)
})

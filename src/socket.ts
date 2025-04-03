import { Server, Socket } from 'socket.io'

interface Usuario {
	id: string
	nombre: string
}

let usuarios: Usuario[] = []

export function setupSocket(io: Server) {
	io.on('connection', (socket: Socket) => {
		socket.on('establecerNombre', (nombre: string) => {
			if (!usuarios.some((usuario) => usuario.nombre === nombre)) {
				usuarios.push({
					id: socket.id,
					nombre,
				})
			}

			socket.broadcast.emit('usuarios', usuarios)

			socket.emit('usuarios', usuarios)
		})

		socket.on(
			'llamarUsuario',
			({ usuario, codigo }: { usuario: Usuario; codigo: string }) => {
				const usuarioQueLlama = usuarios.find(
					(usuario) => usuario.id === socket.id
				)

				if (usuarioQueLlama === undefined) return

				socket
					.to(usuario.id)
					.emit('usuarioLlamando', { usuario: usuarioQueLlama, codigo })
			}
		)

		socket.on(
			'llamadaAceptada',
			({ usuario, codigo }: { usuario: Usuario; codigo: string }) => {
				const usuarioQueLlama = usuarios.find(
					(usuario) => usuario.id === socket.id
				)

				if (usuarioQueLlama === undefined) return

				socket.to(usuario.id).emit('llamadaAceptada', codigo)

				usuarios = usuarios.filter(
					(usuarios) => usuarios.id !== socket.id && usuarios.id !== usuario.id
				)

				socket.broadcast.emit('usuarios', usuarios)

				socket.emit('usuarios', usuarios)
			}
		)

		socket.on('mensaje', (data) => {
			console.log('Mensaje recibido:', data)
			io.emit('mensaje', data)
		})

		socket.on('disconnect', () => {
			usuarios = usuarios.filter((usuarios) => usuarios.id !== socket.id)

			socket.broadcast.emit('usuarios', usuarios)
		})
	})
}

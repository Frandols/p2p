const socket = io()

const peer = new RTCPeerConnection()
let canalDeDatos

peer.ondatachannel = (event) => {
	canalDeDatos = event.channel

	configurarCanalDeDatos()
}

let nombreUsuario
let chateandoCon

const usarNombre = document.getElementById('usarNombre')

usarNombre.addEventListener('click', () => {
	const nombre = document.getElementById('nombreInput').value

	if (nombre.trim()) {
		nombreUsuario = nombre

		socket.emit('establecerNombre', nombre)

		document.getElementById('usuarios').classList.remove('hidden')
		document.getElementById('nombreInput').classList.add('hidden')
		usarNombre.classList.add('hidden')

		document.getElementById('contenidoNombre').textContent = nombre
		document.getElementById('nombre').classList.remove('hidden')
	}
})

const enviarMensaje = document.getElementById('sendMessage')

function mostrarMensaje(mensaje, remitente) {
	const messageList = document.getElementById('messageList')
	const newMessage = document.createElement('li')
	newMessage.textContent = `${remitente}: ` + mensaje
	messageList.appendChild(newMessage)
}

enviarMensaje.addEventListener('click', () => {
	const input = document.getElementById('messageInput')
	const mensaje = input.value.trim()

	if (mensaje && canalDeDatos && canalDeDatos.readyState === 'open') {
		canalDeDatos.send(mensaje)

		mostrarMensaje(mensaje, 'Tú')

		input.value = ''
	}
})

async function llamarUsuario(usuario) {
	canalDeDatos = peer.createDataChannel(`chat-${usuario.nombre}`)
	configurarCanalDeDatos()

	const offer = await peer.createOffer()
	await peer.setLocalDescription(offer)

	peer.onicecandidate = (event) => {
		if (!event.candidate) {
			const codigo = JSON.stringify(peer.localDescription)

			socket.emit('llamarUsuario', { usuario, codigo })
		}
	}

	socket.on('llamadaAceptada', (codigo) => {
		const oferta = JSON.parse(codigo)

		peer.setRemoteDescription(new RTCSessionDescription(oferta)).then(() => {
			chateandoCon = usuario.nombre

			ocultarUsuarios()
		})
	})
}

socket.on('usuarios', (usuarios) => {
	const userList = document.getElementById('user-list')

	const usuariosFiltrados = usuarios.filter(
		(usuarios) => usuarios.nombre !== nombreUsuario
	)

	if (usuariosFiltrados.length > 0) {
		document.getElementById('noHayUsuarios').classList.add('hidden')
	}

	if (usuariosFiltrados.length === 0) {
		document.getElementById('noHayUsuarios').classList.remove('hidden')
	}

	while (userList.firstChild) {
		userList.removeChild(userList.firstChild)
	}

	// Generar la lista de usuarios
	usuariosFiltrados.forEach((usuario) => {
		const li = document.createElement('li')
		li.className =
			'p-2 bg-white text-gray-800 border border-gray-300 rounded-lg text-center cursor-pointer hover:bg-gray-200'
		li.textContent = usuario.nombre
		li.onclick = () => llamarUsuario(usuario)
		userList.appendChild(li)
	})
})

function ocultarUsuarios() {
	document.getElementById('usuarios').classList.add('hidden')
}

socket.on('usuarioLlamando', ({ usuario, codigo }) => {
	canalDeDatos = peer.createDataChannel('chat')
	configurarCanalDeDatos()

	const oferta = JSON.parse(codigo)

	recibirOferta(oferta, usuario).then(() => {
		chateandoCon = usuario.nombre

		ocultarUsuarios()
	})
})

/* usarNombre.addEventListener('click', async function () {
	const code = document.getElementById('nombreInput').value

	if (code) {
		document.getElementById('codeInput').value = ''

		const offer = JSON.parse(code)

		await recibirOferta(offer)
	} else {
		alert('Por favor, ingresa un código.')
	}
}) */

const generarCodigo = document.getElementById('generateCode')

generarCodigo.addEventListener('click', async function () {
	canalDeDatos = peer.createDataChannel('chat')
	configurarCanalDeDatos()

	const offer = await peer.createOffer()
	await peer.setLocalDescription(offer)

	peer.onicecandidate = (event) => {
		if (!event.candidate) {
			const codigo = JSON.stringify(peer.localDescription)

			navigator.clipboard.writeText(codigo).then(() => {
				alert('Código copiado. Envia esto al otro dispositivo.')
			})
		}
	}
})

function configurarCanalDeDatos() {
	// Se abre el canal de datos
	canalDeDatos.onopen = () => {
		document.getElementById('chat').classList.remove('hidden')
	}

	// Se recibe un mensaje en el canal de datos
	canalDeDatos.onmessage = (event) => {
		const mensaje = event.data

		console.log(mensaje)

		mostrarMensaje(mensaje, chateandoCon)
	}
}

async function recibirOferta(oferta, usuario) {
	// Establecemos conexion
	await peer.setRemoteDescription(new RTCSessionDescription(oferta))

	// Creamos respuesta SDP
	const answer = await peer.createAnswer()
	await peer.setLocalDescription(answer)

	// Generamos un codigo de respuesta
	peer.onicecandidate = (event) => {
		if (!event.candidate) {
			const codigo = JSON.stringify(peer.localDescription)

			socket.emit('llamadaAceptada', { usuario, codigo })
		}
	}
}

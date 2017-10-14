
// Initialisation

const app = new Vue({
	el: '#app',
	data: {
		view: 'index',
		name: '<name>',
		uuid: '<uuid>',
		loss: '<loss>',
		epoch: '<epoch>',
		stats: {},
		args: {},
		image: '',
		imageType: 'image/png',
		index: {},
	},
	methods: {
		playClick: () => { playClick() },
		pauseClick: () => { pauseClick() },
		stopClick: () => { stopClick() },
		backwardClick: () => { },
		forwardClick: () => { },

		formatEpoch: e => e.toString().padStart(9, "0").match(/.{1,3}/g).join(","),
		formatLoss: l => l.toPrecision(10),
	},
})

// TODO: pull index (current state) from server

const throwIfNotOk = e => {
	if (e.ok) {
		return e.json()
	}
	throw Error(e.status)
}

fetch('/api/ai').then(throwIfNotOk).then(data => {
	app.index = data
}).catch(e => {console.error(e)})

const showIndex = () => {
	app.view = 'index'
}

const showAi = uuid => {
	app.uuid = uuid
	fetch('/api/ai/' + app.uuid).then(throwIfNotOk).then(data => {
		app.name = data.name
		app.args = data.args
		app.loss = data.lastupdate.loss
		app.epoch = data.lastupdate.epoch
		app.stats = data.lastupdate.stats
		app.image = data.lastupdateimage.image

		app.view = 'ai'
	}).catch(e => {
		console.error(e)
		window.location.hash = ""
	})
}

const checkHash = () => {
	const match = window.location.hash.match('#!/ai/')
	if (match && match.index == 0) {
		showAi(window.location.hash.slice(6))
	} else {
		showIndex()
	}
}

checkHash()
window.addEventListener('hashchange', checkHash, false)

// Stream events

const stream = new EventSource('/api/stream')

stream.addEventListener('New', (e) => {
	const o = JSON.parse(e.data)
	const data = o.data
	const uuid = o.uuid
	Vue.set(app.index, uuid, data)
})

stream.addEventListener('Update', (e) => {
	const o = JSON.parse(e.data)
	const data = o.data
	const uuid = o.uuid
	if (app.uuid != uuid) {
		return
	}
	app.loss = data.loss
	app.epoch = data.epoch
	app.stats = data.stats
})

stream.addEventListener('UpdateImage', (e) => {
	const o = JSON.parse(e.data)
	const data = o.data
	const uuid = o.uuid
	if (app.uuid != uuid) {
		return
	}
	app.image = data.image
})

stream.addEventListener('Delete', (e) => {
	const o = JSON.parse(e.data)
	const data = o.data
	const uuid = o.uuid
	Vue.delete(app.index, uuid)
})

// Final steps

document.querySelector('#app').classList.remove('d-none')
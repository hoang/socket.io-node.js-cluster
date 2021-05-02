var cluster = require('cluster'),
	sio = require('socket.io');

var server = require('./server');

var port = 3000,
	num_processes = require('os').cpus().length;

if (cluster.isMaster) {
	console.log('nu_processes', num_processes);
	for (var i = 0; i < num_processes; i++) {
		cluster.fork();
	}

	cluster.on('exit', (worker, code, signal) => {
		console.log(`worker ${worker.process.pid} died`);
		console.log("Let's fork another worker!");
		cluster.fork();
	});
} else {
	server();
}
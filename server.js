const fs = require('fs');
const jwt = require('jsonwebtoken');
const cert = fs.readFileSync('public.pem');

module.exports = () => {
    const httpServer = require("http").createServer();
    const io = require("socket.io")(httpServer, {
        cors: {
            origin: "*"
        },
        allowRequest: (req, callback) => {
            let isOriginValid = true;
            const token = req._query.token;
            try {
                var decoded = jwt.verify(token, cert);
				req.accid = decoded.accid;
            } catch (err) {
                console.error('verify jwt failed', err.message);
                isOriginValid = false;
            }
            callback(null, isOriginValid);
        }
    });
    const redis = require("socket.io-redis");
    io.adapter(redis({ host: "172.17.0.4", port: 6379 }));

    io.on("connection", (socket) => {
        console.log('new connection', 'process id', process.pid);
		socket.data.accid = socket.request.accid;

		socket.on('chat', async ({sendTo}) => {
			const sockets = await io.fetchSockets();
			for (let _socket of sockets) {
				if (_socket.data.accid == sendTo) {
					_socket.emit('chat', {
						message: socket.data.accid + ' want to chat with you'
					});
				}
			}
		})

		socket.on('query_online_users', async () => {
			const sockets = await io.fetchSockets();
			let data = [];
			for (let _socket of sockets) {
				data.push(_socket.data.accid);
			}
			socket.emit('online_users', data);
		})

        socket.on('disconnect', reason => {
            console.log('a client disconnected!', reason, 'process id', process.pid);
        });
    });

    httpServer.listen(3000, () => {
        console.log('server running on port 3000');
    });
};
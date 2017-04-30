var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var ina219 = require('ina219');

ina219.init();
//  ina219.enableLogging(true);
ina219.calibrate32V1A(function() {
    ina219.getCurrent_mA(function(current) {
        console.log("Current (mA): " + current);
    });
});

function emitVoltage() {
    ina219.getBusVoltage_V(function(volts) {
        //console.log(volts);
        io.emit("volts", volts);
    })
}

function emitCurrent() {
    ina219.getCurrent_mA(function(mA) {
       // console.log(mA);
        io.emit("current", mA);
    })
}

setInterval(emitVoltage, 100);
setInterval(emitCurrent, 100);
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

// io.on('connection', function(socket) {
//     socket.on('chat message', function(msg) {
//         io.emit('chat message', msg);
//     });
// });

http.listen(port, function() {
    console.log('listening on *:' + port);
});

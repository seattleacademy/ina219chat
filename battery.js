var app = require('express')();
var http = require('http').Server(app);
var port = process.env.PORT || 3000;
var ina219 = require('ina219');

var fs = require('fs');


ina219.init();
//ina219.enableLogging(true);
ina219.calibrate32V2A(function() {
    ina219.getBusVoltage_V(function(volts) {
        console.log(`Volts: ${volts}`);
    });
});

const dataFileName = 'battery.tsv'
const firstLine = `time\tvolts\tA\tW\twH\tap\twp\tvm\r`
//fs.writeFile(dataFileName, firstLine, { 'flag': 'w' }, function() {});
//fs.writeFile(dataFileName, firstLine, { 'flag': 'a' }, console.log);

let last = Date.now();
let wh = 0;
let n = 0;
let sumVolts = 0;
let sumAmps = 0;
let sumWatts = 0;
let maxAmps = 0;
let maxWatts = 0;
let minVolts = 1000;

function clearCounters() {
    n = 0;
    sumVolts = 0;
    sumAmps = 0;
    sumWatts = 0;
    maxAmps = 0;
    maxWatts = 0;
    minVolts = 1000;
}


function readPower() {
    ina219.getBusVoltage_V(function(volts) {
        ina219.getCurrent_mA(function(mA) {
            n++;
            let A = mA / 1000;
            let W = volts * A;
            sumVolts += volts;
            sumAmps += A;
            sumWatts += W;
            if (Math.abs(A) > Math.abs(maxAmps)) maxAmps = A;
            if (Math.abs(W) > Math.abs(maxWatts)) maxWatts = W;
            if (volts < minVolts) minVolts = volts;
            //console.log(sumWatts, n)
        })
    })
}

function writePower() {
    const A = sumAmps / n;
    const W = sumWatts / n;
    const volts = sumVolts / n;
    const now = new Date().toLocaleTimeString();
    const elapsed = Date.now() - last;
    wh += W * elapsed / 1000 / 60 / 60;
    last = Date.now();
    let data = `${now}\t${volts.toFixed(3)}\t${A.toFixed(3)}\t${W.toFixed(3)}`;
    data += `\t${wh.toFixed(3)}\t${maxAmps.toFixed(3)}\t${maxWatts.toFixed(3)}\t${minVolts.toFixed(3)}\r`;
    console.log(data);
    fs.writeFile(dataFileName, data, { 'flag': 'a' }, function() {});
    clearCounters();
}


readPower();
setInterval(readPower, 50);
setInterval(writePower, 60000);


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/' + dataFileName);
});


http.listen(port, function() {
    console.log('listening on :' + port);
});

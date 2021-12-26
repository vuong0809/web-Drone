const btnConnect = document.getElementById('btn_connect');
const videoView = document.createElement('video');
const results = document.getElementById('results');
const camera = document.getElementById('view-Cam');
const userID = document.getElementById('user_id');
const btnPredict = document.getElementById('btn_predict');


const ctx = results.getContext("2d");

btnPredict.addEventListener('click', test_prediction);
btnConnect.addEventListener('click', Serial);

const weightsSensor = '/neural/test_model/model.json';

const weights = 'yolov5s_web_model/model.json';
const [modelWeight, modelHeight] = [256, 256];
const names = ['person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
    'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
    'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
    'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
    'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
    'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
    'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
    'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear',
    'hair drier', 'toothbrush'
]

// const weights = 'fire_web_model/model.json';
// const [modelWeight, modelHeight] = [320, 320];
// const names = ['fire']

var model = undefined;
var modelSenor = undefined;
var listCamera = undefined;
var port = undefined;
var fire_position = undefined;
activate();
load(weights, weightsSensor);

var gaugeOptions = {
    chart: {
        type: 'solidgauge'
    },
    title: null,
    pane: {
        center: ['50%', '50%'],
        size: '100%',
        startAngle: -90,
        endAngle: 90,
        background: {
            backgroundColor:
                Highcharts.defaultOptions.legend.backgroundColor || '#EEE',
            innerRadius: '60%',
            outerRadius: '100%',
            shape: 'arc'
        }
    },
    exporting: {
        enabled: false
    },
    tooltip: {
        enabled: false
    },

    // the value axis
    yAxis: {
        stops: [
            [0.1, '#55BF3B'], // green
            [0.5, '#DDDF0D'], // yellow
            [0.9, '#DF5353'] // red
        ],
        lineWidth: 0,
        tickWidth: 0,
        minorTickInterval: null,
        tickAmount: 2,
        title: {
            y: -30
        },
        labels: {
            y: 20
        }
    },

    plotOptions: {
        solidgauge: {
            dataLabels: {
                y: -35,
                borderWidth: 0,
                useHTML: true
            }
        }
    }
};

// The speed gauge
var chartSpeed = Highcharts.chart('container-speed', Highcharts.merge(gaugeOptions, {
    yAxis: {
        min: 0,
        max: 100,
        title: {
            text: 'predict'
        }
    },
    credits: {
        enabled: false
    },
    series: [{
        name: 'Speed',
        data: [0],
        dataLabels: {
            format:
                '<div style="text-align:center">' +
                '<span style="font-size:45px">{y} %</span><br/>' +
                // '<span style="font-size:12px;opacity:0.4">km/h</span>' +
                '</div>'
        },
        tooltip: {
            valueSuffix: ' km/h'
        }
    }]

}));





async function load(weights, weightsSensor) {
    model = await tf.loadGraphModel(weights);
    modelSenor = await tf.loadLayersModel(weightsSensor);
    modelSenor.summary();
    viewListCamera();
}

navigator.mediaDevices.enumerateDevices().then(function (devices) {
    devices.forEach(element => {
        if (element.kind == 'videoinput' && element.label == "") {
            navigator.mediaDevices.getUserMedia({ video: true }).then(function () {
                location.reload();
            });
        }
        if (element.kind == 'videoinput') {
            listCamera = devices;
            return;
        }
    });
});

async function viewListCamera() {
    const list = document.getElementById('list_camera');
    listCamera.forEach(element => {
        if (element.kind == 'videoinput') {
            const item = document.createElement('div');
            item.className = 'mt-2';
            item.innerHTML = `
                            <a id = "${element.deviceId}" class="list-group-item list-group-item-action py-3 lh-tight" onclick="enableCam(this.id)">
                                <div class="d-flex w-100 align-items-center justify-content-between">
                                <strong class="mb-1">${element.label}</strong>
                                </div>
                            <div class="col-10 mb-1 small " style = "overflow: hidden" >${element.deviceId}</div>
                            </a>
                            `;
            list.appendChild(item);
        }
    });
}

function enableCam(device) {
    if (model) {
        results.style = '';
        var constraints = {
            video: {
                width: 1920,
                height: 1080,
                deviceId: device ? { exact: device } : undefined
            }
        };
        navigator.mediaDevices.getUserMedia(constraints).then(function (mediaStream) {
            videoView.srcObject = mediaStream;
            videoView.onloadedmetadata = function (e) {
                videoView.play();
            };
            videoView.addEventListener('loadeddata', predictWebcam);
        });
    }
    else console.log('model loading .....');
}

function predictWebcam() {
    const input = tf.tidy(() => {
        return tf.image.resizeBilinear(tf.browser.fromPixels(videoView), [modelWeight, modelHeight])
            .div(255.0)
            .expandDims(0);
    });
    model.executeAsync(input).then(res => {
        drawBox(res);
        tf.dispose([res, input]);
    });
    window.requestAnimationFrame(predictWebcam);
}

const drawBox = (res) => {
    results.width = camera.offsetWidth;
    results.height = results.width * 9 / 16
    ctx.clearRect(0, 0, results.width, results.height);
    ctx.drawImage(videoView, 0, 0, results.width, results.height);

    ctx.font = "80px Arial";
    ctx.fillStyle = "#FFFF00";
    ctx.lineWidth = 1;
    ctx.fillText('+', results.width / 2 - 25, 30);

    const [boxes, scores, classes, valid_detections] = res;
    const boxes_data = boxes.dataSync();
    const scores_data = scores.dataSync();
    const classes_data = classes.dataSync();
    const valid_detections_data = valid_detections.dataSync()[0];

    var a = [], b = [], prev, result = '';
    for (i = 0; i < valid_detections_data; ++i) {
        if (classes_data[i] !== prev) {
            a.push(names[classes_data[i]]);
            b.push(1);
        } else b[b.length - 1]++;
        prev = classes_data[i];
    }
    for (i = 0; i < a.length; i++) {
        result = result + a[i] + ': ' + b[i] + ', ';
    }

    ctx.font = "20px Arial";
    ctx.fillStyle = "#00FFFF";
    ctx.lineWidth = 4;
    ctx.fillText(`${result} `, 5, 20);

    for (i = 0; i < valid_detections_data; ++i) {
        let [x1, y1, x2, y2] = boxes_data.slice(i * 4, (i + 1) * 4);
        x1 *= results.width;
        x2 *= results.width;
        y1 *= results.height;
        y2 *= results.height;
        const width = x2 - x1;
        const height = y2 - y1;
        const klass = names[classes_data[i]];
        const score = scores_data[i].toFixed(2);

        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 4;
        ctx.strokeRect(x1, y1, width, height);

        ctx.font = "20px Arial";
        ctx.fillStyle = "#00FFFF";
        ctx.lineWidth = 4;
        ctx.fillText(`${klass} ${score}`, x1, y1);

        if (classes_data[i] == 0) {

            var fire_x = (x1 + x2) / 2;
            var fire_y = (y1 + y2) / 2;

            ctx.font = "80px Arial";
            ctx.fillStyle = "#FF0000";
            ctx.lineWidth = 4;
            ctx.fillText('.', fire_x, fire_y);

            fire_x = mapValue(fire_x, 0, results.width, 85, 95);
            fire_y = mapValue(fire_y, 0, results.height, 35, 95);

            fire_x = fire_x.toFixed(0);
            fire_y = fire_y.toFixed(0);

            fire_position = JSON.parse(`
                {
                    "position":{
                        "x": ${fire_x},
                        "y": ${fire_y}
                    }
                }
            `);
            return;

        }
    }
}

function activate() {
    document.getElementById('block-test').style.display = "";
    const image = new Image(1260, 710);
    image.onload = drawImageActualSize;
    image.src = 'img/nocam/noCamera1.jpg';

    function drawImageActualSize() {
        results.width = camera.offsetWidth;
        results.height = results.width * 9 / 16
        ctx.drawImage(this, 0, 0, results.width, results.height);
    }
}

async function Serial() {

    if (userID.value) {
        if (navigator.serial) {
            try {
                port = await navigator.serial.requestPort();
                await port.open({ baudRate: 9600 });

                const decoder = new TextDecoderStream();
                port.readable.pipeTo(decoder.writable);
                const inputStream = decoder.readable;
                const reader = inputStream.getReader();

                userID.disabled = true;
                const connect = document.getElementById('connect');
                connect.removeChild(btnConnect);
                console.log(userID.value);

                activate();

                setInterval(() => {
                    if (fire_position) {
                        sendGateway('fire_position', fire_position);
                        fire_position = undefined;
                    }
                }, 2000);

                while (true) {
                    const { value, done } = await reader.read();
                    if (value) {
                        PrintSerial('GateWay: ' + value + '\n');
                    }
                    if (done) {
                        console.log('[readLoop] DONE', done);
                        reader.releaseLock();
                        break;
                    }
                }
            }
            catch (error) {
                PrintSerial(error + '\n');
            }
        } else {
            alert('Web Serial API not supported.');
        }
    }
    else PrintSerial('Vui lòng nhập User ID \n');

}

async function test_prediction() {

    const sensor = document.getElementById('sensor');
    const input = sensor.value;
    const strInput = input.split(" ");

    // console.log(strInput)
    const numInput = strInput.map(ele => {
        return parseInt(ele);
    });

    const result = await modelSenor.predict(tf.tensor(numInput, [1, numInput.length])).arraySync();

    var predicVal = result[0];
    predicVal = predicVal[1];
    predicVal = predicVal.toFixed(2);
    predicVal *= 100;

    if (chartSpeed) {
        const point = chartSpeed.series[0].points[0];
        point.update(predicVal);
    }

}

async function prediction() {

    const sensor = document.getElementById('sensor');
    const input = sensor.value;
    const strInput = input.split(" ");
    console.log(strInput)
    const numInput = strInput.map(ele => {
        return parseInt(ele);
    });
    const result = await modelSenor.predict(tf.tensor(numInput, [1, numInput.length])).arraySync();

    var predicVal = result[0];
    predicVal = predicVal[1];
    predicVal = predicVal.toFixed(2);
    predicVal *= 100;

    if (chartSpeed) {
        const point = chartSpeed.series[0].points[0];
        point.update(predicVal);
    }

}




async function sendGateway(event, msg) {
    if (msg && port) {
        // sendZalo();
        var frame = {};
        frame.event_name = event;
        frame.body = msg;

        PrintSerial('Send: ' + JSON.stringify(frame) + '\n\n\n');

        const encoder = new TextEncoder();
        const writer = port.writable.getWriter();
        await writer.write(encoder.encode(`${JSON.stringify(frame)}\n`));
        writer.releaseLock();
    }
    else PrintSerial('no data or port \n');
}

function sendZalo() {
    // fetch('https://openapi.zalo.me/v2.0/oa/message', {
    //     method: 'POST',
    //     headers: {
    //         'access_token': 'nCtbMQ-e2Yl9o-THewmF9CFAu5UejNnWcDJYMFlqRMhctDPCtkvaVFhozMcQncz9h_JWVuViRcoxte95eTPdK8Blqdovn7PQqwtWGBUU13MtbvO7lRu11DkjbZFlhGays9wy7REa5XBOe8OAowuJAkt8crsAj01TaAQ99h2701MCXBarkB8H5O-9W3ckwcKpoyw1A_Fj1JpLwkb8ukyPKCJjgdVEop9lpVYzIDx-0MV4_kjtpkXKKkYFstJvhMa5_hFiFkItVpRdjkeopRv15DIVoI_afM84m8AE1CBd5n5rKb7TGgMo2oW ',
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //         "recipient": {
    //             "user_id": "3469747508247772258",
    //         },
    //         "message": {
    //             "text": `[Emergency Warning] Today December 24, 2021, current room temperature is 31, humidity is 70% and smoke is detected, potential fire hazard. Please check immediately `,
    //             // "quote_message_id":data.message.msg_id
    //         }
    //     })
    // })
    //     .then(response => response.json())
    //     .then(dt => {
    //         console.log(dt);
    //         res.send(dt);
    //     });
}

function PrintSerial(msg) {
    const log = document.getElementById('Serial');
    log.scrollTop = log.scrollHeight;
    log.append(msg);
}

function mapValue(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}


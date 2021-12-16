// const { io } = require("socket.io-client");

const camera = document.getElementById('view-Cam');
const videoView = document.createElement('video');
const list_camera = document.getElementById('list_camera');
const results = document.getElementById('results');
const ctx = results.getContext("2d");
const socket = io()


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
var myVar;

load(weights);

async function load(weights) {
    model = await tf.loadGraphModel(weights);
    ctx.clearRect(0, 0, results.width, results.height);
    // tf.setBackend('webgl');
    console.log(tf.getBackend());
    list_camera.style.display = '';
}

navigator.mediaDevices.enumerateDevices().then(function (devices) {
    devices.forEach(element => {
        if (element.kind == 'videoinput' && element.label == "") {
            navigator.mediaDevices.getUserMedia({ video: true }).then(function () {
                location.reload();
            });
        }
        if (element.kind == 'videoinput') {
            const item = document.createElement('div');
            item.innerHTML = `
                            <a id = "${element.deviceId}" class="list-group-item list-group-item-action py-3 lh-tight" onclick="enableCam(this.id)">
                                <div class="d-flex w-100 align-items-center justify-content-between">
                                <strong class="mb-1">${element.label}</strong>
                                </div>
                            <div class="col-10 mb-1 small " style = "overflow: hidden" >${element.deviceId}</div>
                            </a>
                            `;
            list_camera.appendChild(item);
        }
    });
});

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
        clearInterval(myVar);
        setInterval(sendImg, 10000);
    }
    else console.log('model loading .....');
}

function enableTest() {
    if (model) {
        list_camera.style.display = 'none';
        videoView.width = 320;
        videoView.autoplay = true;
        videoView.src = 'img/20181013_084542.mp4'
        videoView.loop = true;
        videoView.muted = true;
        results.style.display = '';
        results.width = 320;
        videoView.play();
        videoView.addEventListener('loadeddata', predictWebcam);
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

        // console.log(klass, score, x1, y1, x2, y2);
    }
}

function sendImg() {
    var imgString = results.toDataURL();
    socket.emit('StreamID', { "socketID": socket.id, "img": imgString });
}
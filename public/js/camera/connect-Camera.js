const socket = io();
socket.on("connect", () => {
    // socket.on(socket.id,msg=>{
    //     const imgItem = document.getElementById('image');
    //     imgItem.src = `data:image/png;base64,${msg.img}`;
    // });
    socket.on(`ResultsID${socket.id}`,msg=>{
        console.log(msg);
    });
  });
const list_camera = document.getElementById('list_camera');
navigator.mediaDevices.getUserMedia({  video: true }).then(function(){
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
        for(var i = 0; i < devices.length; i ++){
            var device = devices[i];
            if (device.kind === 'videoinput') {
                const item = document.createElement('div');
                item.id = device.deviceId;
                item.innerHTML = `
                <a id = "${device.deviceId}" class="list-group-item list-group-item-action py-3 lh-tight" onclick="viewCamera(this.id)">
                    <div class="d-flex w-100 align-items-center justify-content-between">
                    <strong class="mb-1">${device.label}</strong>
                    </div>
                <div class="col-10 mb-1 small " style = "overflow: hidden" >${device.deviceId}</div>
                </a>
                `;
                list_camera.appendChild(item);
            }
        };
    });
});

var canvas = document.getElementById("preview");
var context = canvas.getContext("2d");

// setInterval(()=>{
//     context.drawImage(video,0,0,context.width, context.height);
//     var imgString = canvas.toDataURL();
//     imgString = imgString.slice(22);
//     socket.emit("StreamID",{"socketID":socket.id, "img": imgString});
// },1000);

var val;

function Connect(){
    clearInterval(val);
    val = setInterval(()=>{
        context.drawImage(video,0,0,context.width, context.height);
        var imgString = canvas.toDataURL();
        imgString = imgString.slice(22);
        socket.emit("StreamID",{"socketID":socket.id, "img": imgString});
    },1000);
}

function viewCamera(device){
    var video = document.getElementById("video");
    var constraints = {video: {  width: 1920, height: 1080, deviceId: device } };

    canvas.width = 640;
    canvas.height = canvas.width*9/16;
    context.width = canvas.width;
    context.height = canvas.height;
    navigator.mediaDevices.getUserMedia(constraints).then(function(mediaStream) {
        var video = document.querySelector('video');
        video.srcObject = mediaStream;
        video.onloadedmetadata = function(e) {
            video.play();
        };
    })
    .catch(function(err) { console.log(err.name + ": " + err.message); });
    Connect();
}

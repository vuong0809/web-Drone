// fetch('/api/camera')
//     .then(res => res.json())
//     .then(dt =>{
//         for(i in dt){
//             const camera = document.getElementById('camera');
//             const item = document.createElement('img');
//             item.id = dt[i].url;
//             item.src = 'img/noCamera.jpg'
//             camera.appendChild(item);
//         }
//     })

// fetch('/api/camera')
//     .then(res => res.json())
//     .then(dt =>{
//         for(i in dt){
//             const listCamera = document.getElementById('listCamera');
//             const item = document.createElement('li');
//             item.textContent = dt[i].name
//             listCamera.appendChild(item);
//         }
//     })
// function loadDoc() {
//     const xhttp = new XMLHttpRequest();
//     xhttp.onload = function() {
//           document.getElementById("demo").innerHTML =
//           this.responseText;
//         }
//         xhttp.open("GET", "ajax_info.txt");
//         xhttp.send();
//       }
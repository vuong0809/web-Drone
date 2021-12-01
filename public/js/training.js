const socket = io();
const btnTraining = document.getElementById('btn_train');
const formTrain = document.getElementById('form_Train');
const formUpload = document.getElementById('form_upload');
const listFile = document.getElementById('list-file');
const listData = document.getElementById('list-dataset');

formTrain.addEventListener("submit", training);
formUpload.addEventListener("submit", create);

getData();

socket.on('connect', () => {
    textConsole(socket.id);
    socket.emit('trainStartus', '');
    socket.on('trainStartus', (msg) => {
        if (!msg) {
            btnTraining.disabled = false;
            btnTraining.innerHTML = `
            Training
            `;
        }
        else {
            btnTraining.disabled = true;
            btnTraining.innerHTML = `
            <span class="spinner-border spinner-border-sm"></span>
            Training..
            `;
        }
    });
    socket.on('dataset', (msg) => {
        msg.forEach(element => {
            const item = document.createElement('option');
            item.textContent = element;
            listData.appendChild(item);
        });
    });
});

async function create(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const url = form.action;
    const formData = new FormData(form);
    var plainFormData = Object.fromEntries(formData.entries());
    plainFormData.nc = plainFormData.names.split(',').length;
    textConsole(JSON.stringify(plainFormData));
    socket.emit('CreateTrainingFile', plainFormData);
    // const responseData = await postAPI({ url, formData });
}

async function training(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const url = form.action;
    const formData = new FormData(form);
    const plainFormData = Object.fromEntries(formData.entries());
    textConsole(JSON.stringify(plainFormData));
    socket.emit('training', plainFormData);
    // const responseData = await postAPI({ url, formData });
}

async function postAPI({ url, formData }) {
    const plainFormData = Object.fromEntries(formData.entries());
    const formDataJsonString = JSON.stringify(plainFormData);
    const fetchOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: formDataJsonString
    };

    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
    return response.json();
}

async function getData() {
    fetch('api/list-file')
        .then(response => response.json())
        .then(dt => {
            dt.forEach(element => {
                const item = document.createElement('option');
                item.textContent = element;
                listFile.appendChild(item);
            });
        })
}

function textConsole(msg) {
    const txtConsole = document.getElementById('console');
    txtConsole.scrollTop = txtConsole.scrollHeight;
    txtConsole.append(msg + '\n');
}
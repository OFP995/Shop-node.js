// нужно послать AJAX запрос на сервер

function sendLogin() {
    fetch('/login', { // AJAX запрос куда посылаю
        method: 'POST',
        body: JSON.stringify({
            'login': document.querySelector('#login').value,  // эти данные ушли на сервер
            'password': document.querySelector('#password').value, // эти данные ушли на сервер
        }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
}

// чтобы форма по стандарту не отправлялась на admin

document.querySelector('form').onsubmit = function (event) {  // перехватываем событие и запускаем ф-ю sendLogin
    event.preventDefault();
    sendLogin();
}
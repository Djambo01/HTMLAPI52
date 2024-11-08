// Переменные для хранения широты и долготы
let latitude, longitude;

// Получаем HTML элементы
const locationDiv = document.getElementById('location');
const savedDataDiv = document.getElementById('saved-data');
const indexedDBDataDiv = document.getElementById('indexedDB-data');
const commentField = document.getElementById('comment');

// Инициализация IndexedDB
let db;
const request = indexedDB.open("GeolocationDB", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore("locations", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("latitude", "latitude", { unique: false });
    objectStore.createIndex("longitude", "longitude", { unique: false });
    objectStore.createIndex("comment", "comment", { unique: false });
    console.log("IndexedDB store created");
};

request.onsuccess = function(event) {
    db = event.target.result;
    displayIndexedDBData();
};

request.onerror = function(event) {
    console.error("Ошибка при работе с IndexedDB", event);
};

// Определение местоположения
document.getElementById('getLocation').onclick = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            locationDiv.innerHTML = `Координаты: широта ${latitude}, долгота ${longitude}`;
        }, () => {
            locationDiv.innerHTML = "Не удалось получить местоположение";
        });
    } else {
        locationDiv.innerHTML = "Geolocation API не поддерживается вашим браузером.";
    }
};

// Сохранение данных в LocalStorage
document.getElementById('saveToLocal').onclick = function() {
    const comment = commentField.value.trim();
    if (!latitude || !longitude || !comment) {
        alert("Пожалуйста, заполните комментарий и определите местоположение.");
        return;
    }
    const data = { latitude, longitude, comment };
    const key = `location_${new Date().getTime()}`;
    localStorage.setItem(key, JSON.stringify(data));
    displayLocalStorageData();
    saveToIndexedDB(data);
    commentField.value = '';
};

// Отображение данных из LocalStorage
function displayLocalStorageData() {
    savedDataDiv.innerHTML = '';
    Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('location_')) {
            const data = JSON.parse(localStorage.getItem(key));
            const itemDiv = document.createElement('div');
            itemDiv.textContent = `Комментарий: ${data.comment} | Координаты: ${data.latitude}, ${data.longitude}`;
            savedDataDiv.appendChild(itemDiv);
        }
    });
}

// Сохранение данных в IndexedDB
function saveToIndexedDB(data) {
    const transaction = db.transaction(["locations"], "readwrite");
    const objectStore = transaction.objectStore("locations");
    const request = objectStore.add(data);
    request.onsuccess = function() {
        displayIndexedDBData();
    };
    request.onerror = function(event) {
        console.error("Ошибка при добавлении данных в IndexedDB", event);
    };
}

// Отображение данных из IndexedDB
function displayIndexedDBData() {
    indexedDBDataDiv.innerHTML = '';
    const transaction = db.transaction(["locations"], "readonly");
    const objectStore = transaction.objectStore("locations");

    objectStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const itemDiv = document.createElement('div');
            itemDiv.textContent = `Комментарий: ${cursor.value.comment} | Координаты: ${cursor.value.latitude}, ${cursor.value.longitude}`;
            indexedDBDataDiv.appendChild(itemDiv);
            cursor.continue();
        }
    };
}

// Инициализация данных при загрузке страницы
window.onload = function() {
    displayLocalStorageData();
    displayIndexedDBData();
};

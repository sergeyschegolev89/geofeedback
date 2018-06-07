let myMap,
    clusterer,
    coords,
    pagePixels,
    storage = {};
let form = document.querySelector('.form');
let formName = document.querySelector('.reviewFormName');
let formPlace = document.querySelector('.reviewFormPlace');
let formReview = document.querySelector('.reviewFormText');
let headerName = document.querySelector('.headerName');
let closeButton = document.querySelector('.headerClose');
let addButton = document.querySelector('.addButton');
let reviewList = document.querySelector('.list');

new Promise(resolve => ymaps.ready(resolve))
    .then(() => {
        myMap = new ymaps.Map('map', {
            center: [59.93591169, 30.33030079],
            zoom: 12
        }, {
            searchControlProvider: 'yandex#search'
        });
        main();
    })

    .catch(e => alert('Ошибка: ' + e.message));

function main() {
    initClusterer();
    if (localStorage.reviews) {
        storage = JSON.parse(localStorage.reviews);
        getAllReviews();
    }
    myMap.events.add('click', function (e) {
        coords = e.get('coords');
        pagePixels = e.get('pagePixels');
        ymaps.geocode(coords)
            .then( function(res) {
                let firstGeoObject = res.geoObjects.get(0);
                let address = firstGeoObject.properties.get('text');

                showForm(address);
            })
            .catch(e => alert('Не удалось загрузить адрес: ' + e.message));
    });
    closeButton.addEventListener('click', closeForm);
    addButton.addEventListener('click', addReview);
    document.addEventListener('click', getForm);
    headerName.parentNode.addEventListener('mousedown', Dnd);
    headerName.parentNode.addEventListener('mouseup', () => document.onmousemove = null);
    myMap.balloon.events.add('open', closeForm);
}
function initClusterer() {
    let customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        '<h2 class=ballonPlace>{{ properties.balloonPlace|raw }}</h2>' +
        '<a href="#" class="balloonAddress" >{{ properties.balloonAddress|raw }}</a></br></br>' +
        '<div class=ballonReview>{{ properties.balloonReview|raw }}</div>' +
        '<div class=ballonDate>{{ properties.balloonDate|raw }}</div>'
    );

    clusterer = new ymaps.Clusterer({
        preset: 'islands#invertedVioletClusterIcons',
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonItemContentLayout: customItemContentLayout,
        clusterDisableClickZoom: true,
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false
    });

    myMap.geoObjects.add(clusterer);
}
function showForm(address) {
    if (storage[address]) {
        getReviews(address);
    } else {
        reviewList.innerHTML = 'Отзывов пока нет';
    }
    myMap.balloon.close();
    headerName.innerText = address;
    form.style.display = 'block';
    form.style.left = pagePixels[0]+'px';
    form.style.top = pagePixels[1]+'px';
}
function closeForm() {
    clearForm();
    form.style.display = 'none';
}
function addReview() {
    let address = headerName.innerText;
    let date = new Date();
    let data = {
        'coords': coords,
        'address': address,
        'name': formName.value,
        'place': formPlace.value,
        'text': formReview.value,
        'date': date.toLocaleString()
    };

    if (checkReview(data)) {
        addPlacemark(data);
        let item = createItem(data);

        if (reviewList.innerHTML === 'Отзывов пока нет') {
            reviewList.innerHTML = '';
        }
        reviewList.appendChild(item);
        if (!storage[address]) {
            storage[address] = [];
        }
        storage[address].push(data);
        localStorage.reviews = JSON.stringify(storage);
        clearForm();
    }
}
function addPlacemark(data) {
    let placemark = new ymaps.Placemark(data.coords, {
        balloonPlace: data.place,
        balloonAddress: data.address,
        balloonReview: data.text,
        balloonDate: data.date
    }, {
        preset: 'islands#violetDotIcon'
    });

    placemark.events.add('click', function (e) {
        pagePixels = e.get('pagePixels');
        coords = data.coords;
        showForm(data.address);
    });
    clusterer.add(placemark);
}
function clearForm() {
    formName.value = '';
    formPlace.value = '';
    formReview.value = '';
}
function checkReview(data) {
    if (!data.name.length) {
        alert('Введите имя');

        return false;
    }
    if (!data.place.length) {
        alert('Укажите место');

        return false;
    }
    if (!data.text.length) {
        alert('Напишите отзыв');

        return false;
    }

    return true;
}
function createItem(data) {
    let item = document.createElement('li');

    item.className = 'item';
    item.innerHTML =
        '<div class="itemTop">' +
            '<span class="itemName">' + data.name + '</span> ' +
            '<span class="itemPlace">' + data.place + '</span> ' +
            '<span class="itemDate">' + data.date + '</span>' +
        '</div>' +
        '<div class="itemText">' + data.text + '</div>';

    return item;
}
function getForm(e) {
    if (e.target.className === 'balloonAddress') {
        pagePixels = [e.pageX, e.pageY];
        showForm(e.target.innerText);
    }
}
function getReviews(address) {
    let list = document.createDocumentFragment();

    storage[address].forEach((data) => {
        let item = createItem(data);

        list.appendChild(item);
    });
    reviewList.innerHTML = '';
    reviewList.appendChild(list);
}
function getAllReviews() {
    storage = JSON.parse(localStorage.reviews);
    for (let addr in storage) {
        if (storage.hasOwnProperty(addr)) {
            storage[addr].forEach(data => addPlacemark(data));
        }
    }
}
function Dnd(e) {
    let shiftX = e.pageX - form.getBoundingClientRect().left;
    let shiftY = e.pageY - form.getBoundingClientRect().top;

    document.onmousemove = function(e) {
        form.style.left = e.pageX - shiftX + 'px';
        form.style.top = e.pageY - shiftY + 'px';
    };
}
import {
    checkLink,
    clearElementChildren,
    copyToClipboard,
    createInputField,
    fieldTypes
} from "./tools.js";

const imageSizeOptions = {
    orig: 'Исходный',
    s1880x760: '1880 x 760',
    s840x840: '840 x 840',
    s750x300: '750 x 300',
    s1170x600: '1170 x 600',
    s585x300: '585 x 300',
    s686x380: '686 x 380',
    s760x440: '760 x 440',
    s2520x1000: '2520 x 1000',
    s1260x500: '1260 x 500',
    s420x420: '420 x 420'
};

function makeSizeSelectors(imageSizeOptions) {
    const selectors = document.createElement('select');
    selectors.className = 'form-select w-100';
    selectors.id = 'image-size-dropdown';
    selectors.value = 'orig';
    selectors.setAttribute('aria-label', 'Исходный');

    for (const value in imageSizeOptions) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = imageSizeOptions[value];
        if (value === 'orig') {
            option.selected = true;
        }
        selectors.appendChild(option);
    }

    return selectors;
}

function createInputGroupCol(size, child, classes='', label=undefined) {
    const col = document.createElement('div');
    col.className = `col-md-${size}${' ' + classes}`;

    if (label) {
        col.appendChild(label);
    }

    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    inputGroup.appendChild(child);

    col.appendChild(inputGroup);

    return col;
}

export function createEventInfoSection() {
    const container = document.getElementById('main-container');
    clearElementChildren(container);

    const rows = [document.createElement('div'), document.createElement('div')];
    rows.forEach(row => {
        row.className = 'row';
    });

    const inputField = createInputField({
        id: 'event-link',
        type: fieldTypes.LINK,
        name: 'Ссылка на событие',
        placeholder: 'Введите ссылку на событие'
    });
    const eventLinkInput = createInputGroupCol(12, inputField[1], '', inputField[0]);
    rows[0].appendChild(eventLinkInput);

    const getInfoButton = createInputField({
        id: 'get-event-btn',
        type: fieldTypes.BUTTON,
        class: 'primary',
        text: 'Получить инфо'
    });
    const getInfoGroup = createInputGroupCol(6, getInfoButton, 'text-center');
    rows[0].appendChild(getInfoGroup);

    const resetInfoButton = createInputField({
        id: 'reset-info-btn',
        type: fieldTypes.BUTTON,
        class: 'danger',
        text: 'Сбросить'
    });
    const resetInfoGroup = createInputGroupCol(6, resetInfoButton);
    rows[0].appendChild(resetInfoGroup);

    const imageLinkField = createInputField({
        id: 'image-link',
        type: fieldTypes.TEXT,
        name: 'Ссылка на изображение',
        placeholder: 'Ждем инфо события',
        class: 'readonly-input',
        readonly: true
    });
    const imageLinkGroup = createInputGroupCol(12, imageLinkField[1], '', imageLinkField[0]);
    rows[1].appendChild(imageLinkGroup);

    const makeSelectors = makeSizeSelectors(imageSizeOptions);
    const selectorsGroup = createInputGroupCol(6, makeSelectors);
    rows[1].appendChild(selectorsGroup);

    const copyButton = createInputField({
        id: 'copy-button',
        type: fieldTypes.BUTTON,
        class: 'secondary',
        text: 'Скопировать'
    });
    const copyButtonGroup = createInputGroupCol(6, copyButton);
    rows[1].appendChild(copyButtonGroup);

    container.appendChild(rows[0]);
    container.appendChild(rows[1]);

    setEventListeners();
}

function setEventListeners() {
    document.getElementById('get-event-btn').addEventListener('click', async function () {
        const getEventButton = document.getElementById('get-event-btn');
        let eventLink = document.getElementById('event-link');
        if (checkLink(eventLink, '3,')) {
            document.getElementById('image-link').value = '';
            getEventButton.disabled = true;
            getEventButton.style.backgroundColor = '#ccc';
            getEventButton.textContent = 'Ищем инфо...';

            await getEventLink(eventLink.value);

            getEventButton.disabled = false;
            getEventButton.style.backgroundColor = '#007bff';
            getEventButton.textContent = 'Получить инфо';
        }
    });

    document.getElementById('image-size-dropdown').addEventListener('change', function(event) {
        event.value = this.value;
    });

    document.getElementById('reset-info-btn').addEventListener('click', function() {
        document.getElementById('event-link').value = '';
        document.getElementById('image-link').value = '';
    });

    document.getElementById('copy-button').addEventListener('click', function() {
        copyImageLink();
    });
}

async function getEventLink(link) {
    try {
        const response = await fetch('/auto/event', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 'event-link': link })
        });
        if (response.ok) {
            const data = await response.json();
            document.getElementById('image-link').value = data.image_link;
        }
    } catch (error) {
        console.log(error.message);
    }
}

function copyImageLink() {
    const imageLinkField = document.getElementById('image-link');
    const imageLinkValue = imageLinkField.value + document.getElementById('image-size-dropdown').value;

    let value = imageLinkValue.length > 15 ? imageLinkValue : '';

    copyToClipboard(imageLinkField, value, 'текст');
}
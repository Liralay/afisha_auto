import {
    checkEmptyInput,
    checkLink,
    clearElementChildren,
    copyToClipboard,
    createInputField, createLabel,
    fieldTypes
} from "./tools.js";

const cities = {
    'moscow': 'Москва',
    'saint-petersburg': 'Санкт-Петербург',
    'other': 'Другой город'
};

const standardFields = [
    { id: 'main-link', type: fieldTypes.LINK, name: 'Главная ссылка', placeholder: 'Введите главную ссылку' },
    { id: 'pre-header', type: fieldTypes.TEXT, name: 'Текст прехедера', placeholder: 'Введите прехедер' },
    { id: 'header', type: fieldTypes.TEXT, name: 'Текст заголовка', placeholder: 'Введите заголовок' },
    { id: 'main-text', type: fieldTypes.TEXT, name: 'Основной текст', placeholder: 'Введите основной текст' },
    { id: 'letter-signature', type: fieldTypes.TEXT, name: 'Подпись письма', placeholder: 'Введите текст подписи' }
];

const optionalFields = [
    { id: 'main-image', type: fieldTypes.TEXT, name: 'Главное изображение', placeholder: 'Введите ссылку на изображение' },
    { id: 'button-text', type: fieldTypes.TEXT, name: 'Текст кнопки', placeholder: 'Введите текст кнопки' },
    { id: 'disclaimer', type: fieldTypes.TEXT, name: 'Дисклеймер', placeholder: 'Введите текст дисклеймера' }
];

const digestTypes = {
    'mix': {
        city: true,
        mainEvent: true,
        optionalFields: ['main-image'],
        links: 6
    },
    'selection': {
        optionalFields: ['main-image', 'button-text'],
        links: 6
    },
    'king': {
        city: true,
        optionalFields: ['main-image'],
        links: 5,
        texts: true,
        buttons: true
    },
    'mix-old': {
        city: true,
        mainEvent: true,
        links: 6
    }
};

const numerals = {
    0: 'основно',
    1: 'перво',
    2: 'второ',
    3: 'треть',
    4: 'четверто',
    5: 'пято',
    6: 'шесто',
    7: 'седьмо',
    8: 'восьмо'
}

export function buildDigestFields(digestType) {
    createDigestForm();

    const type = digestTypes[digestType];

    const digest = {};

    if (type.city) {
        digest['city'] = {id: 'city'};
    }

    const allFields = [...standardFields];

    if (type.optionalFields) {
        type.optionalFields.forEach((optionalField) => {
            const field = optionalFields.find((of) => of.id === optionalField);
            if (field) {
                allFields.push(field);
            }
        });
    }

    allFields.forEach((field) => {
        digest[field.id] = {
            id: field.id,
            type: field.type,
            name: field.name,
            placeholder: field.placeholder
        };
    });

    if (type.links) {
        for (let number = type.mainEvent ? 0 : 1; number <= type.links; number++) {
            digest[`link${number}`] = {
                id: `link${number}`,
                type: fieldTypes.LINK,
                name: `Ссылка на ${numerals[number]}е событие`,
                placeholder: `Введите ссылку на ${numerals[number]}е событие`
            };

            if (type.texts) {
                digest[`text${number}`] = {
                    id: `text${number}`,
                    type: fieldTypes.TEXT,
                    name: `Текст ${numerals[number]}го события`,
                    placeholder: `Введите текст ${numerals[number]}го события`,
                };
            }

            if (type.buttons) {
                digest[`button${number}`] = {
                    id: `button${number}`,
                    type: fieldTypes.TEXT,
                    name: `Текст ${numerals[number]}й кнопки`,
                    placeholder: `Введите текст ${numerals[number]}й кнопки`,
                };
            }
        }
    }

    const form = document.getElementById("digest-form");

    const inputElements = Object.values(digest).map(field => createInputField(field));
    const halfCount = Math.ceil(inputElements.length / 2);

    const columns = [document.createElement("div"), document.createElement("div")];
    columns.forEach(column => {
        column.className = "col-md-6";
        form.appendChild(column);
    });

    inputElements.forEach((elements, index) => {
        const targetColumn = index < halfCount ? columns[0] : columns[1];
        elements.forEach(element => {
            targetColumn.appendChild(element);
        });
    });

    if (type.city) {
        setCityListener();
    }

    createDigestResultGroup();
}

function createDigestForm() {
    const container = document.getElementById('main-container');
    clearElementChildren(container);

    const row = createInputField({type: fieldTypes.DIV, class: 'row'});

    const formDiv = createInputField({type: fieldTypes.DIV, class: 'col-md-8'});
    const digestForm = document.createElement('form');
    digestForm.className = 'row g-3';
    digestForm.id = 'digest-form'
    formDiv.appendChild(digestForm);

    const resultDiv = createInputField({type: fieldTypes.DIV, class: 'col-md-4', id: 'digest-result-group'});

    row.appendChild(formDiv);
    row.appendChild(resultDiv);

    container.appendChild(row);
}

export function createCityDropdown() {
    const label = createLabel({id: 'letter-city-dropdown', name: 'Город дайджеста'});

    const dropdownContainer = createInputField({type: fieldTypes.DIV, class: 'w-100'});

    const dropdown = createInputField({type: fieldTypes.DIV, class: 'dropdown'});

    const dropdownButton = createInputField({
        type: fieldTypes.BUTTON,
        id: 'letter-city-dropdown',
        class: 'secondary dropdown-toggle text-start',
        text: 'Выберите город'
    });
    dropdownButton.value = 'other'
    dropdownButton.dataset.bsToggle = "dropdown";
    dropdownButton.setAttribute("aria-expanded", "false");

    const dropdownMenu = document.createElement("ul");
    dropdownMenu.className = "dropdown-menu";
    dropdownMenu.setAttribute("aria-labelledby", "letter-city-dropdown");

    dropdown.appendChild(dropdownButton);
    dropdown.appendChild(dropdownMenu);
    dropdownContainer.appendChild(dropdown);

    for (const key in cities) {
        const value = cities[key];
        const listItem = document.createElement('li');
        listItem.innerHTML = `<a class="dropdown-item" data-city="${key}">${value}</a>`;
        dropdownMenu.appendChild(listItem);
    }

    return [label, dropdownContainer];
}

function setCityListener() {
    const cityChoice = document.querySelector('.dropdown-menu');
    if (cityChoice) {
        const customLinkInput = document.getElementById('main-link');
        customLinkInput.value = '';
        customLinkInput.readOnly = true;
        customLinkInput.classList.remove('editable-input');
        customLinkInput.classList.add('readonly-input');
        customLinkInput.placeholder = 'Необходимо выбрать город';

        cityChoice.addEventListener('click', function(event) {
            const customLinkInput = document.getElementById('main-link');
            if (event.target.classList.contains('dropdown-item')) {
                const selectedCity = event.target.getAttribute('data-city');
                document.getElementById('letter-city-dropdown').value = selectedCity;

                customLinkInput.value = '';
                customLinkInput.readOnly = selectedCity !== 'other';
                customLinkInput.classList.remove('readonly-input', 'editable-input');
                customLinkInput.classList.add(selectedCity === 'other' ? 'editable-input' : 'readonly-input');
                customLinkInput.placeholder = selectedCity === 'other' ? 'Введите главную ссылку' : `${determineEnding(cities[selectedCity])} ${cities[selectedCity]}`;
            }
        });
    }
}

function determineEnding(word) {
    const lastLetter = word[word.length - 1];

    if (lastLetter === 'ь' || lastLetter === 'а') {
        return 'Выбрана';
    } else if (lastLetter === 'о') {
        return 'Выбрано';
    }

    return 'Выбран';
}

function createDigestResultGroup() {
    const digestResultGroup = document.getElementById("digest-result-group");
    clearElementChildren(digestResultGroup);

    const h4 = document.createElement("h4");
    h4.textContent = "Верстка дайджеста:";
    digestResultGroup.appendChild(h4);

    const textarea = document.createElement("textarea");
    textarea.id = "response-textarea";
    textarea.rows = 19;
    textarea.cols = 150;
    textarea.className = "w-100";
    digestResultGroup.appendChild(textarea);

    const versionGroup = createInputField({type: fieldTypes.DIV, id: 'version-group'});
    digestResultGroup.appendChild(versionGroup);

    const rowDiv = createInputField({type: fieldTypes.DIV, class: 'row'});
    versionGroup.appendChild(rowDiv);

    const buttonGroup = createInputField({type: fieldTypes.DIV, class: 'd-flex justify-content-evenly'});
    rowDiv.appendChild(buttonGroup);

    const makeButton = createInputField({
        id: 'make-button',
        type: fieldTypes.BUTTON,
        class: 'primary',
        text: 'Собрать дайджест'
    });
    buttonGroup.appendChild(makeButton);

    const copyButton = createInputField({
        id: 'copy-button',
        type: fieldTypes.BUTTON,
        class: 'secondary',
        text: 'Скопировать'
    });
    buttonGroup.appendChild(copyButton);

    document.getElementById('make-button').addEventListener('click', async function () {
        if(validateFields()) {
            const makeDigestButton = document.getElementById('make-button');
            const digestType = makeDigestButton.value;

            makeDigestButton.disabled = true;
            makeDigestButton.style.backgroundColor = '#ccc';
            makeDigestButton.textContent = 'Ожидание...';

            await makeDigest(digestType);

            makeDigestButton.disabled = false;
            makeDigestButton.style.backgroundColor = '#007bff';
            makeDigestButton.textContent = 'Собрать дайджест';
        }
    });

    document.getElementById('copy-button').addEventListener('click', function () {
        const textarea = document.getElementById('response-textarea');
        textarea.select();
        textarea.setSelectionRange(0, 99999);

        copyToClipboard(textarea, textarea.value, 'верстку');
    });
}

async function makeDigest(digestType) {
    let textarea = document.getElementById('response-textarea');
    textarea.value = '';

    try {
        const response = await fetch(`/auto/digest?digestType=${digestType}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(getDigestData())
        });
        if (response.ok) {
            const data = await response.json();
            const progress = data.progress;
            const digest = data.digest;

            let pre = document.createElement('pre');
            pre.textContent = progress;

            textarea.value = digest;
        }
    } catch (error) {
        console.log(error.message);
    }
}

function validateFields() {
    let isValid = true;
    let requiredFields = document.querySelectorAll('#digest-form input');

    const cityField = document.getElementById('letter-city-dropdown');
    const is_other = cityField ? cityField.value === 'other' : true;

    requiredFields.forEach(function(field) {
        if (checkEmptyInput(field) && (field.id !== 'main-link' || (field.id === 'main-link' && is_other))) {
            isValid = false;
            field.classList.add('is-invalid');
        } else {
            field.classList.remove('is-invalid');
        }
    });

    let linkFields = document.querySelectorAll('#digest-form input[type="link"]');

    linkFields.forEach(function(linkField) {
        let quantifiers = linkField.id === 'main-link' ? '1,' : '3,';
        if (!(linkField.id === 'main-link' && !is_other)) {
            if (!checkLink(linkField, quantifiers)) {
                linkField.classList.add('is-invalid');
                isValid = false;
            }
        }
    });

    return isValid;
}

function getDigestData() {
    let digest_info = {'events': {}};
    let formElements = document.querySelectorAll('#digest-form input');

    formElements.forEach(function(element) {
        let fieldName = element.id;
        if (fieldName.includes('link') && fieldName !== 'main-link') {
            let linkName = fieldName.replace('link', '');
            digest_info['events'][linkName] = element.value;
        } else {
            digest_info[fieldName] = element.value;
        }
    });

    const cityField = document.getElementById('letter-city-dropdown');
    if (cityField && cityField.value === 'other') {
        digest_info['main-link'] = document.getElementById('main-link').value;
    } else if (cityField && cityField.value !== 'other') {
        digest_info['main-link'] = `https://afisha.yandex.ru/${cityField.value}`;
    } else {
        digest_info['main-link'] = document.getElementById('main-link').value;
    }

    return digest_info;
}
import {createCityDropdown} from "./digests.js";

export const fieldTypes = {
    TEXT: 'text',
    LINK: 'link',
    BUTTON: 'button',
    DIV: 'div'
}

export function checkLink(field, quantifiers) {
    let urlRegex = new RegExp(`^https:\/\/afisha\.yandex\.ru(\/[0-9a-zA-Z-_]+){${quantifiers}}\/?$`);
    return urlRegex.test(field.value.trim());
}

export function checkEmptyInput(field) {
    return field.value.trim() === '';
}

export function copyToClipboard(document, value, entity) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value)
            .catch((error) => {
                console.error(`Не удалось скопировать ${entity}`, error);
            });
    } else {
        try {
            const successful = document.execCommand('copy');
            if (!successful) {
                console.error(`Не удалось скопировать ${entity} (альтернативный способ)`);
            }
        } catch (error) {
            console.error(`Не удалось скопировать ${entity} (альтернативный способ)`, error);
        }
    }
}

export function clearElementChildren(element) {
    element.classList.add('fade-out');
    setTimeout(function() {
        element.classList.remove('fade-out');
    }, 400);

    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }

    element.classList.add('fade-in');
    setTimeout(function() {
        element.classList.remove('fade-in');
    }, 400);
}

export function createInputField(field) {
    if (field.id === 'city') {
        return createCityDropdown();
    } else if (field.type === fieldTypes.TEXT || field.type === fieldTypes.LINK) {
        return [createLabel(field), createInput(field)]
    } else if (field.type === fieldTypes.BUTTON) {
        return createButton(field);
    } else if (field.type === fieldTypes.DIV) {
        return createDiv(field);
    }
}

export function createLabel(field) {
    const label = document.createElement("label");
    label.htmlFor = field.id;
    label.className = "w-100 col-form-label";
    label.textContent = field.name;

    return label;
}

function createInput(field) {
    const inputContainer = createDiv({class: 'w-100'});

    const input = document.createElement("input");
    input.type = field.type;
    input.id = field.id;
    input.name = field.id;
    input.placeholder = field.placeholder;
    input.className = `form-control ${field.class}`;

    if (field.required) {
        input.required = true;
    }

    if (field.readonly) {
        input.readOnly = true;
    }

    inputContainer.appendChild(input);

    return inputContainer;
}

function createButton(field) {
    const button = document.createElement('button');
    button.className = `btn btn-${field.class} w-100`;
    button.type = 'button';
    button.id = field.id;
    button.textContent = field.text;

    return button;
}

function createDiv(field) {
    const div = document.createElement('div');
    div.className = field.class;

    if (field.id) {
        div.id = field.id;
    }

    return div;
}
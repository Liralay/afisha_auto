import setDarkThemeToggler from "./dark-theme.js";

import {buildDigestFields} from "./digests.js";
import {createEventInfoSection} from "./event.js";

window.addEventListener('load', setStartInfo);

function setStartInfo() {
    setDarkThemeToggler();

    setTypesListeners();
    document.getElementById('mix-btn').click();

    document.getElementById('changelog-icon').addEventListener('click', function() {
        window.location.href = '/auto/changelog';
    });

    document.getElementById('wiki').addEventListener('click', function () {
        window.location.href='https://wiki.yandex-team.ru/media-crm/komandnaja-stranica-crm/bz/processy/rabochie-processy/avtosborschik/autoassembler/';
    });

    document.getElementById('write-author').addEventListener('click', function () {
        window.location.href='https://t.me/IoannVS';
    });
}

function setTypesListeners() {
    const typeButtons = document.querySelectorAll('.type-btn');

    typeButtons.forEach(button => {
        button.addEventListener('click', event => {
            const typeValue = event.target.value;

            if (button.classList.contains('active')) {
                return;
            }

            typeButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');

            switch (typeValue) {
                case 'event':
                    createEventInfoSection();
                    break;
                // case 'promo':
                //     makeFields(typeValue);
                //     break;
                case 'mix':
                    makeFields(typeValue);
                    break;
                case 'selection':
                    makeFields(typeValue);
                    break;
                case 'king':
                    makeFields(typeValue);
                    break;
            }
        });
    });
}

function makeFields(type) {
    buildDigestFields(type);
    document.getElementById('make-button').value = type;
}
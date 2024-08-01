import setDarkThemeToggler from "./dark-theme.js";

window.addEventListener('load', setStartInfo);

async function setStartInfo() {
    setDarkThemeToggler();

    await fetchChangelogData('minor');

    const changelogTypeRadios = document.querySelectorAll('#changelogTypeGroup input[type="radio"]');

    changelogTypeRadios.forEach(radio => {
        radio.addEventListener('click', function () {
            changelogTypeRadios.forEach(r => {
                if (r !== radio) {
                    r.checked = false;
                }
            });

            const selectedChangelogType = radio.value;
            fetchChangelogData(selectedChangelogType);
        });
    });
}

async function fetchChangelogData(changelogType) {
    await fetch(`/auto/changelog?changelogType=${changelogType}`)
        .then(response => response.json())
        .then(data => {
            const changelogContainer = document.getElementById('changelog-container');

            changelogContainer.innerHTML = '';

            const versions = Object.keys(data).sort((a, b) => versionCompare(b, a));

            for (const version of versions) {
                const versionData = data[version];
                const versionCard = createVersionCard(version, versionData.date, versionData.changes);
                changelogContainer.appendChild(versionCard);
            }

            const cardBodies = document.querySelectorAll('.card-body');
            for (let i = 1; i < cardBodies.length; i++) {
                cardBodies[i].classList.add('d-none');
            }
        })
        .catch(error => console.error('Error fetching changelog:', error));
}

function createVersionCard(version, date, changes) {
    const card = document.createElement('div');
    card.classList.add('card', 'mb-3');

    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header', 'd-flex', 'justify-content-between', 'align-items-center');
    const versionHeader = document.createElement('span');
    versionHeader.textContent = `Версия ${version}`;
    const dateSpan = document.createElement('span');
    dateSpan.classList.add('text-secondary');
    dateSpan.textContent = formatDate(date);
    cardHeader.appendChild(versionHeader);
    cardHeader.appendChild(dateSpan);

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const changesList = document.createElement('ul');
    changesList.classList.add('list-group', 'list-group-flush');

    changes.forEach((change) => {
        const changeItem = document.createElement('li');
        changeItem.classList.add('list-group-item');
        const indentLevel = getIndentLevel(change);
        changeItem.style.paddingLeft = `${indentLevel * 20}px`;

        if (indentLevel >= 1) {
            const marker = getMarker(indentLevel);
            changeItem.innerHTML = `${marker} ${change.trim().substring(indentLevel)}`;
        } else {
            changeItem.innerHTML = change.trim().substring(indentLevel);
        }

        changesList.appendChild(changeItem);
    });

    cardBody.appendChild(changesList);
    card.appendChild(cardHeader);
    card.appendChild(cardBody);

    cardHeader.addEventListener('click', () => {
        cardBody.classList.toggle('d-none');
    });

    return card;
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('ru-RU', options);
}

function getIndentLevel(text) {
    return text.search(/\S|$/) / 2;
}

function getMarker(indentLevel) {
    const markers = ['•', '◦', '▪'];
    return markers[Math.min(indentLevel - 1, markers.length - 1)];
}

function versionCompare(a, b) {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    for (let i = 0; i < partsA.length; i++) {
        if (partsA[i] !== partsB[i]) {
            return partsA[i] - partsB[i];
        }
    }
    return partsA.length - partsB.length;
}
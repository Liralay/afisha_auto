from datetime import datetime, timedelta
from json import loads
from locale import LC_ALL, setlocale
from logging import basicConfig, ERROR, getLogger
from re import search

from bs4 import BeautifulSoup
from cv2 import cvtColor, COLOR_BGR2GRAY, imdecode
from fake_useragent import UserAgent
from numpy import asarray, uint8
from requests import Session, get

setlocale(
    category=LC_ALL,
    locale="Russian"
)

basicConfig(level=ERROR)
logger = getLogger(__name__)


def get_soup(event_link, new_session=None, new_agent=None):
    user_agent = new_agent if new_agent else UserAgent().random
    session = new_session if new_session else Session()

    head = {'User-Agent': user_agent}
    response = session.get(event_link, headers=head)

    return BeautifulSoup(response.text, "html.parser")


def get_image(event_soup, is_places, is_selections):
    try:
        if is_places or is_selections:
            image_data = event_soup.select_one('div.i-react.event-card-react.i-bem')
            data_bem = loads(image_data['data-bem'])
            return f"{data_bem['event-card-react']['props']['image']['url'].rsplit('/', 1)[0]}/"
        else:
            image_data = event_soup.select_one('script[type="application/ld+json"]')
            json_data = loads(image_data.string)
            return f"{json_data[0].get('image').rsplit('/', 1)[0]}/"

    except (Exception, AttributeError):
        logger.error('Не удалось найти тег изображения')
        return 'https://avatars.mds.yandex.net/get-afishanew/21626/5da6c6ca477c4988653a1946b85b008b/'


def get_place(event_soup, is_places, is_selections):
    try:
        if is_places:
            return event_soup.select_one('h1.place-heading-info__title').text
        elif is_selections:
            return 'Разные места'
        else:
            return event_soup.select_one('span.event-concert-description__place-name').text
    except (Exception, AttributeError):
        logger.error('Не удалось найти тег места')
        return 'НАЙТИ МЕСТО'


def get_name(event_soup, is_places, is_selections):
    try:
        if is_places:
            return get_place(event_soup, is_places, is_selections)
        elif is_selections:
            return event_soup.select_one('div.rubric-header__title').text.split(' в ')[0]
        else:
            return event_soup.select_one('div.event-concert-description__title-info').text
    except (Exception, AttributeError):
        logger.error('Не удалось найти тег названия')
        return 'НАЙТИ ИМЯ'


def get_age_mark(event_soup, is_places, is_selections):
    try:
        if is_places or is_selections:
            return 18
        else:
            return int(event_soup.select_one('div.event-concert-heading__content-rating').text[:-1])
    except (Exception, AttributeError):
        logger.error('Не удалось найти тег возрастной метки')
        return 18


def get_date(event_soup, is_places, is_selections):
    try:
        if is_places or is_selections:
            current_month = datetime.strftime(datetime.today(), '%B')
            next_month = datetime.strftime(datetime.today() + timedelta(days=30), '%B')
            return f"{current_month.lower()}, {next_month.lower()}"
        else:
            date_data = event_soup.select_one('div.event-concert-description__cities')
            dates_data = event_soup.select('span.session-date__day')

            if 'Расписание' in date_data.text and not dates_data:
                script_text = event_soup.select_one('script.i-redux').text
                match = search(r'"dateGroups":\[(.*?)]', script_text)
                event_schedule_dates = loads(f'[{match.group(1)}]')
                titles = [group['title'] for group in event_schedule_dates]

                limited_months = [month.lower() for month in titles[:2]]
                return ', '.join(limited_months) if len(limited_months) > 1 else limited_months[0]

            elif not dates_data:
                months_data = event_soup.select('.month-picker__link')
                months = [month.get_text().lower() for month in months_data]
                selected_months = [months[0], months[-1]] if len(months) > 2 else months
                return ', '.join(selected_months)

            else:
                dates_text = [elem.text.replace(',', '') for elem in dates_data]

                if len(dates_text) == 1:
                    return dates_text[0]
                else:
                    dates = []
                    first_date_month = dates_text[0].split(' ')[1]

                    for date_text in dates_text:
                        day, month_text = date_text.split(' ')
                        if month_text == first_date_month:
                            dates.append(day)
                    if len(dates) <= 2:
                        return f"{' и '.join(elem for elem in dates)} {first_date_month}"
                    else:
                        return f"{dates[0]} — {dates[-1]} {first_date_month}"
    except (Exception, AttributeError):
        logger.error('Не удалось найти тег дат')
        return 'НАЙТИ ДАТЫ'


def get_genre(event_soup, is_places, is_selections):
    events_type_list = [
        'Вечеринка', 'Выставка', 'Фестиваль', 'Концерт', 'Опера', 'Мюзикл', 'Балет', 'Спектакль', 'Шоу', 'Выставка',
        'Театр', 'Иммерсивная экскурсия', 'Литературные чтения', 'Спорт'
    ]

    try:
        if is_places:
            genre_data = event_soup.select_one('.place-heading-info__tags')
            return genre_data.text

        elif is_selections:
            genre_data = get_name(event_soup, is_places, is_selections)

        else:
            genre_data = event_soup.select('li.tags__item')

        for ev_type in events_type_list:
            if ev_type.lower() in str(genre_data).lower():
                return ev_type

        return genre_data if is_selections else 'НАЙТИ ЖАНР'
    except (Exception, AttributeError):
        logger.error('Не удалось найти тег жанра')
        return 'НАЙТИ ЖАНР'


def get_cashback(event_soup, is_places, is_selections):
    try:
        if is_places or is_selections:
            cashback_data = event_soup.select('div._1itVYJ')
            cashback_massive = [cashback.get_text(separator=' ').strip().split(' ') for cashback in cashback_data]

            max_cashback = []
            max_num_cashback = 0
            for cashback in cashback_massive:

                match = search(r'\d+', cashback[-1])
                current_number = int(match.group())

                if current_number > max_num_cashback:
                    max_cashback = cashback
                    max_num_cashback = current_number

            return ['до', max_cashback[-1]]

        else:
            cashback_data = (event_soup.select_one('div.i-react.plus-cashback-badge-react.i-bem')
                             .get_text(separator=' ').strip().split(' '))
            return cashback_data

    except (Exception, AttributeError):
        logger.error('Не удалось найти тег кешбэка')
        return ['НАЙТИ', 'КЕШБЭК']


def get_discount(event_soup, is_places, is_selections):
    try:
        if is_places or is_selections:
            discount_data = event_soup.select('span.PriceBlock-njdnt8-11.clNJmr')
            discount_text = [(''.join(discount.text.split('\xa0'))).replace(' ', '') for discount in discount_data]

            min_discount = 1_000_000
            for discount in discount_text:
                match = search(r'\d+', discount)
                num_discount = int(match.group())

                if num_discount < min_discount:
                    min_discount = num_discount

            return f'от {min_discount} ₽' if min_discount != 1_000_000 else ''
        else:
            cashback_data = event_soup.select_one('div.i-react.discount-badge-react.i-bem')
            return cashback_data.text if cashback_data is not None else ''

    except (Exception, AttributeError):
        logger.error('Не удалось найти тег скидки')
        return ''


def is_needed_for_border(image_link, threshold=200):
    image_array = asarray(bytearray(get(image_link).content), dtype=uint8)
    image = imdecode(image_array, -1)

    if image is None:
        logger.error('Не удалось загрузить изображение')
        return False

    gray_image = cvtColor(image, COLOR_BGR2GRAY)

    brightness = gray_image.mean()

    return brightness > threshold


class Event:
    def __init__(self, event_link, session=None, user_agent=None, is_border=False):
        current_session = session if session else None
        current_user_agent = user_agent if user_agent else None

        logger.info(f'Старт обработки ивента: {event_link}')

        event_soup = get_soup(event_link, current_session, current_user_agent)

        is_places = '/places/' in event_link
        is_selections = '/selections/' in event_link

        self.link = (f"{event_link}?{{{{utmFull}}}}"
                     f"{'&utm_content=' + event_link.split('/')[-1] if is_places or is_selections else ''}")

        self.image = get_image(event_soup, is_places, is_selections)
        is_border = is_needed_for_border(f'{self.image}orig') if not is_border else is_border
        self.border = 'solid; border-width: 1px; border-color: #bbbbbb' if is_border else 'none'

        self.place = get_place(event_soup, is_places, is_selections)
        self.name = get_name(event_soup, is_places, is_selections)
        self.age_mark = get_age_mark(event_soup, is_places, is_selections)
        self.date = get_date(event_soup, is_places, is_selections)
        self.genre = get_genre(event_soup, is_places, is_selections)
        self.cashback = get_cashback(event_soup, is_places, is_selections)
        self.discount = get_discount(event_soup, is_places, is_selections)

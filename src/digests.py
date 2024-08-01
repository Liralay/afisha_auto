from logging import getLogger
from random import uniform
from re import sub
from time import sleep
from yaml import safe_load

from fake_useragent import UserAgent
from requests import Session

from event import Event
from tools import make_html_tags, get_current_month_genitive

logger = getLogger(__name__)


def get_events_data(data_dict):
    session = Session()
    user_agent = UserAgent().random

    for event_key in data_dict:
        event_link = data_dict[event_key]
        data_dict[event_key] = Event(event_link, session, user_agent)

        sleep(uniform(1, 3))

    return data_dict


def make_digest(digest_info, digest_type, prefix_path):
    if digest_type == 'mix' or digest_type == 'selection' or digest_type == 'king':
        digest_info = digest_data(digest_info, digest_type, prefix_path)
    elif digest_type == 'mix-old':
        digest_info = old_mix_data(digest_info, prefix_path)
    else:
        return 'Unknown digest type'

    digest_info['pre-header'] = make_html_tags(digest_info['pre-header'])
    digest_info['header'] = make_html_tags(digest_info['header'])
    digest_info['main-text'] = make_html_tags(digest_info['main-text'])
    digest_info['letter-signature'] = make_html_tags(digest_info['letter-signature'])

    with open(f'{prefix_path}/data/{digest_type}.html', 'r', encoding='utf-8') as file:
        html_content = file.read()

    digest_html = sub(r'\{\{\{\{(.+?)}}}}', lambda match: replace_expression(match, digest_info), html_content)

    return digest_html


def digest_data(digest_info, digest_type, prefix_path):
    digest_info['events'] = get_events_data(digest_info['events'])

    if digest_type == 'selection':
        ev_counter = 1
    else:
        ev_counter = 0

    max_age_mark = 0

    if digest_type == 'king':
        digest_info['month'] = get_current_month_genitive()

        with open(f'{prefix_path}/data/categories-king.yaml', 'r', encoding='utf-8') as type_file:
            type_dict = safe_load(type_file)

    other_cshbck_badges = 'https://avatars.mds.yandex.net/get-ott/224348/3f5e96e1-e009-4767-8535-96b52d3342cb/orig'

    for event_key in digest_info['events']:
        event = digest_info['events'][event_key]

        if digest_type == 'king':
            if event.genre in type_dict:
                event_type = f"""
                            <td width="83%" align="left" style="font-family: Helvetica, Arial, sans-serif; font-size: 20px; line-height: 26px; color: #000000; padding-bottom: 18px;">
                              <a href="{event.link}" target="_blank" style="text-decoration: none; color: #000000;">
                                <img width="520" src="{type_dict[event.genre]}" style="display: block; border:none; width: 100%; max-width: 520px; height: auto;" alt="{event.genre}" title="{event.genre}">
                              </a>
                            </td>
                            """
            else:
                event_type = 'Найти жанр'
            digest_info['events'][event_key].type = event_type
        else:
            ev_counter += 1

        digest_info['events'][event_key].name = make_html_tags(digest_info['events'][event_key].name)
        digest_info['events'][event_key].place = make_html_tags(digest_info['events'][event_key].place)

        cashback = event.cashback
        digest_info['events'][event_key].cashback = (f'{cashback[0] if len(cashback) > 1 else ""} <img width="'
                                                     '17" height="17" src="'
                                                     f'{other_cshbck_badges}'
                                                     f'" style="vertical-align: middle; border:none;"'
                                                     f' alt="{" ".join(cashback)}" '
                                                     f'title="{" ".join(cashback)}"> {cashback[-1]}')

        if event.discount != '':
            digest_info['events'][event_key].discount = f"""                                  <td width="4"></td> <td 
            align="left" style="border-radius: 10px; background-color: #F2F2F2; padding-left: 9px; padding-right: 9px; 
            line-height: 31px; color:#000000; font-family: Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 
            bold;"> <a href="{event.link}" target="_blank" style="text-decoration: none; color: #000000;">
            {make_html_tags(event.discount)}</a>
                                      </td>"""

        if event.age_mark > max_age_mark:
            max_age_mark = event.age_mark

    digest_info['max-age-mark'] = max_age_mark

    return digest_info


def old_mix_data(mix_info, prefix_path):
    with open(f'{prefix_path}/data/cashback.yaml', 'r', encoding='utf-8') as cashback_file:
        cashback_dict = safe_load(cashback_file)

    with open(f'{prefix_path}/data/discount.yaml', 'r', encoding='utf-8') as discount_file:
        discount_dict = safe_load(discount_file)

    max_age_mark = 0
    for event_key in mix_info['events']:
        event = mix_info['events'][event_key]

        mix_info['events'][event_key].name = make_html_tags(mix_info['events'][event_key].name)
        mix_info['events'][event_key].place = make_html_tags(mix_info['events'][event_key].place)

        cashback = cashback_dict[' '.join(event.cashback)]
        mix_info['events'][event_key].cashback = (f'<img height="20" src="{cashback[1]}" style="vertical-align: '
                                                  f'middle; border:none;" alt="{cashback[0]}%" title="{cashback[0]}%">')

        if event.discount != '' and 'от' not in event.discount:
            discount = discount_dict[event.discount]
            mix_info['events'][event_key].discount = (
                f'<img height="20" src="{discount[1]}" style="vertical-align: middle; border:none;" '
                f'alt="{discount[0]}" title="{discount[0]}">')
        elif 'от' in event.discount:
            mix_info['events'][event_key].discount = ''

        if event.age_mark > max_age_mark:
            max_age_mark = event.age_mark

    mix_info['max-age-mark'] = max_age_mark

    return mix_info


def replace_expression(match, data_dict):
    expression = match.group(1)
    try:
        result = str(eval(expression, {'data': data_dict}))
        return result
    except Exception as e:
        return f"Error: {e} in expression '{expression}'"

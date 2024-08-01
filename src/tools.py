from datetime import datetime
from os import path
from subprocess import CalledProcessError, run
from yaml import safe_load


def run_update_script(prefix_path):
    try:
        run(f'bash {prefix_path}/update.sh', shell=True, check=True)
    except CalledProcessError:
        pass


def run_restart_script(prefix_path):
    try:
        run(f'bash {prefix_path}/restart.sh', shell=True, check=True)
    except CalledProcessError:
        pass


def get_config_data(config_file_path=None):
    config_file_path = config_file_path if config_file_path else find_config_file('.', 'config.yaml')

    with open(config_file_path, 'r', encoding='utf-8') as config_file:
        config_info = safe_load(config_file)

    return config_info


def find_config_file(start_dir, file_name):
    current_dir = path.abspath(start_dir)
    while True:
        file_path = path.join(current_dir, file_name)
        if path.exists(file_path):
            return file_path

        parent_dir = path.dirname(current_dir)
        if parent_dir == current_dir:
            break

        current_dir = parent_dir

    return None


def make_html_tags(string):
    prepositions = ['без', 'безо', 'близ', 'в', 'во', 'вместо', 'вне', 'для', 'до', 'за', 'из', 'изо', 'из-за',
                    'из-под', 'к', 'ко', 'кроме', 'между', 'меж', 'на', 'над', 'о', 'об', 'обо', 'от', 'ото', 'перед',
                    'передо', 'пред', 'пред', 'пo', 'под', 'подо', 'при', 'про', 'ради', 'с', 'со', 'сквозь', 'среди',
                    'у', 'через', 'чрез', 'и']
    m = string.split(' ')

    for one_word in m:
        if one_word in prepositions:
            m[m.index(one_word)] = one_word + "&nbsp;"
        else:
            m[m.index(one_word)] = one_word + " "

    string = ''.join(str(x) for x in m)
    string = string.replace(" —", "&nbsp;&mdash;")
    string = string.replace("-", "&#8209;")
    string = string.replace(" \"", "&laquo;")
    string = string.replace("\"", "&raquo;")
    string = string.replace("«", "&laquo;")
    string = string.replace("»", "&raquo;")
    string = string.replace("₽", "&#8381;")

    if "им. " in string:
        spl = string.split(" ")
        ind = spl.index("им.")
        if len(spl[ind + 1]) == 2 and len(spl[ind + 2]) == 2 and spl[ind + 1][-1] == "." and spl[ind + 2][-1] == ".":
            spl[ind] += "&nbsp;"
            spl[ind + 1] += "&nbsp;"
            spl[ind + 2] += "&nbsp;"
        elif len(spl[ind + 1]) == 2 and spl[ind + 1][-1] == ".":
            spl[ind] += "&nbsp;"
            spl[ind + 1] += "&nbsp;"
        else:
            spl[ind] += "&nbsp;"
        string = ''.join(str(x if "&nbsp;" in x else x + " ") for x in spl)

    return string.strip()


def get_current_month_genitive():
    months_genitive = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ]

    current_month_index = datetime.now().month
    current_month_genitive = months_genitive[current_month_index]

    return current_month_genitive

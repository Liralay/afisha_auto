from logging import basicConfig, ERROR, getLogger
from logging.handlers import MemoryHandler
from threading import Thread

from flask import Flask, request, render_template, jsonify, Blueprint

from changelog import get_changelog_data, get_changes_for_version, get_filtered_versions
from digests import make_digest
from event import get_image, get_soup
from tools import get_config_data, run_update_script, run_restart_script

basicConfig(level=ERROR)
logger = getLogger(__name__)
memory_handler = MemoryHandler(capacity=10, target=None)
logger.addHandler(memory_handler)


app = Flask(__name__, template_folder='../templates', static_folder='../static')

blueprint = Blueprint('auto', __name__, url_prefix='/auto')


@blueprint.route('/', methods=['GET'])
def main():
    return render_template('panel.html')


@blueprint.route('/event', methods=['POST'])
def get_event_image():
    json_data = request.get_json()
    event_link = json_data['event-link']

    is_places = '/places/' in event_link
    is_selections = '/selections/' in event_link

    event_soup = get_soup(event_link)
    image_link = get_image(event_soup, is_places, is_selections)

    return jsonify({'image_link': image_link})


@blueprint.route('/digest', methods=['POST'])
def get_digest():
    digest_data = request.get_json()
    digest_type = request.args.get('digestType')

    digest_html = make_digest(digest_data, digest_type, prefix_path)

    response = {
        'digest': digest_html,
        'progress': ['TBD']
    }

    return jsonify(response)


@blueprint.route('/update', methods=['POST'])
def github_webhook():
    data = request.json

    if 'ref' in data and data['ref'] == 'refs/heads/master':
        try:
            update_thread = Thread(target=run_update_script(prefix_path))
            update_thread.start()
            update_thread.join()

            config_info = get_config_data(f'{prefix_path}/config.yaml')

            current_version = config_info['current_version']
            status = f'Update success: current version is {current_version}'

            restart_thread = Thread(target=run_restart_script(prefix_path))
            restart_thread.start()

        except Exception:
            status = 'Error'
    else:
        status = 'Invalid Ref'

    return jsonify({'message': 'Webhook received', 'status': status})


@blueprint.route('/changelog', methods=['GET'])
def get_changelog():
    changelog_type = request.args.get('changelogType')
    if not changelog_type:
        return render_template('changelog.html')

    is_minor = changelog_type == 'minor'
    is_patch = changelog_type == 'patch'

    changelog_data = get_changelog_data(prefix_path)
    filtered_versions = get_filtered_versions(changelog_data, is_minor, is_patch)
    filtered_changes = {}
    for version in filtered_versions:
        filtered_changes[version] = get_changes_for_version(changelog_data, version)

    return jsonify(filtered_changes)


app.register_blueprint(blueprint)
if __name__ == '__main__':
    config_data = get_config_data()
    prefix_path = config_data['prefix_path']

    app.run(host='0.0.0.0', port=80)

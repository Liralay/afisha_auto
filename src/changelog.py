from re import findall, search, DOTALL


def get_changelog_data(prefix_path):
    with open(f'{prefix_path}/changelog.md', 'r', encoding='utf-8') as file:
        changelog = file.read()
    return changelog


def get_filtered_versions(changelog, is_minor=False, is_patch=False):
    pattern = r"## Version (\d+)\.(\d+)\.(\d+) \(.*\)\n- .*"

    versions = findall(pattern, changelog)
    previous_major_minor = None
    filtered_minor_versions = []

    for major, minor, patch in reversed(versions):
        current_major_minor = f"{major}{f'.{minor}' if is_minor else ''}{f'.{patch}' if is_patch else ''}"
        if current_major_minor != previous_major_minor:
            filtered_minor_versions.append(f'{major}.{minor}.{patch}')
            previous_major_minor = current_major_minor

    return filtered_minor_versions[::-1]


def get_changes_for_version(changelog, target_version):
    version_pattern = r'### Version (\d+\.\d+\.\d+) \((\d{4}-\d{2}-\d{2})\)'
    version_matches = findall(version_pattern, changelog)

    for version, date in version_matches:
        if version == target_version:
            changes_pattern = rf"{version} \(.*?\)\n(.*?)\n\n"
            changes = search(changes_pattern, changelog, DOTALL).group(1)
            return {'date': date, 'changes': changes.split('\n')}

    return None

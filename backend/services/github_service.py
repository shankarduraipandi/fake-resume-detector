import re
from urllib.parse import urlparse

import requests
from flask import current_app


def verify_github_profile(github_url: str) -> dict:
    username = _extract_github_username(github_url)
    if not username:
        return {
            "url": github_url,
            "username": "",
            "repoCount": 0,
            "public_repos": 0,
            "followers": 0,
            "status": "not_found",
            "verified": False,
        }

    api_url = f"{current_app.config['GITHUB_API_BASE'].rstrip('/')}/users/{username}"
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "ai-fake-resume-detector",
    }

    try:
        response = requests.get(api_url, headers=headers, timeout=10)
        if response.status_code == 404:
            return {
                "url": github_url,
                "username": username,
                "repoCount": 0,
                "public_repos": 0,
                "followers": 0,
                "status": "not_found",
                "verified": False,
            }

        response.raise_for_status()
        data = response.json()
        print(f"[GITHUB] Verified GitHub profile for @{username}")
        return {
            "url": github_url,
            "username": data.get("login", username),
            "repoCount": data.get("public_repos", 0),
            "public_repos": data.get("public_repos", 0),
            "followers": data.get("followers", 0),
            "status": "verified",
            "verified": True,
        }
    except Exception as error:
        print(f"[GITHUB] Verification failed for {github_url}: {error}")
        return {
            "url": github_url,
            "username": username,
            "repoCount": 0,
            "public_repos": 0,
            "followers": 0,
            "status": "not_found",
            "verified": False,
        }


def _extract_github_username(github_url: str) -> str | None:
    if not github_url:
        return None

    text = github_url.strip()
    if re.fullmatch(r"[A-Za-z0-9-]+", text):
        return text

    try:
        parsed = urlparse(text)
        path = parsed.path.strip("/")
        if "github.com" not in parsed.netloc.lower():
            return None
        if not path:
            return None
        return path.split("/")[0]
    except Exception:
        return None

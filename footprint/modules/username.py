from __future__ import annotations
import asyncio
from dataclasses import dataclass, field
from typing import Optional
import httpx

@dataclass(frozen=True, slots=True)
class UsernameResult:
    platform: str
    url:      str
    found:    bool
    status:   int
    error:    Optional[str] = field(default=None)

_BODY_NOT_FOUND_SIGNALS: dict[str, list[str]] = {
    "Medium": ["404", "Page not found", "No results for"],
    "Dev.to": ["404", "Page not found", "The page you were looking for doesn't exist"],
    "Letterboxd": ["Sorry, we can't find that page", "Page not found"],
    "Tumblr": ["There's nothing here", "not-found"],
    "About.me": ["We couldn't find that page"],
}

_REDIRECT_NOT_FOUND_URLS: dict[str, list[str]] = {
    "Instagram": ["https://www.instagram.com/", "https://instagram.com/"],
    "Pinterest": ["https://www.pinterest.com/"],
}

async def scan_username(username: str, platform: str, url_template: str, session: Optional[httpx.AsyncClient] = None) -> UsernameResult:
    profile_url = url_template.format(username) if "{}" in url_template else url_template + username
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}
    _owns_session = session is None
    client = session or httpx.AsyncClient(follow_redirects=True, timeout=10.0, headers=headers)
    try:
        response = await client.get(profile_url)
        status = response.status_code
        final_url = str(response.url)
        if platform in _REDIRECT_NOT_FOUND_URLS:
            for bad_url in _REDIRECT_NOT_FOUND_URLS[platform]:
                if final_url.rstrip("/") == bad_url.rstrip("/"):
                    return UsernameResult(platform=platform, url=profile_url, found=False, status=status)
        if status in (404, 410, 400, 403):
            return UsernameResult(platform=platform, url=profile_url, found=False, status=status)
        if platform in _BODY_NOT_FOUND_SIGNALS and status == 200:
            if any(signal in response.text for signal in _BODY_NOT_FOUND_SIGNALS[platform]):
                return UsernameResult(platform=platform, url=profile_url, found=False, status=status)
        if 200 <= status < 300:
            return UsernameResult(platform=platform, url=profile_url, found=True, status=status)
        return UsernameResult(platform=platform, url=profile_url, found=False, status=status)
    except Exception as e:
        return UsernameResult(platform=platform, url=profile_url, found=False, status=0, error=str(e))
    finally:
        if _owns_session:
            await client.aclose()

from __future__ import annotations

VERSION: str = "1.0.0"

BANNER: str = r'''
 ███████╗ ██████╗  ██████╗ ████████╗██████╗ ██████╗ ██╗███╗   ██╗████████╗
 ██╔════╝██╔═══██╗██╔═══██╗╚══██╔══╝██╔══██╗██╔══██╗██║████╗  ██║╚══██╔══╝
 █████╗  ██║   ██║██║   ██║   ██║   ██████╔╝██████╔╝██║██╔██╗ ██║   ██║   
 ██╔══╝  ██║   ██║██║   ██║   ██║   ██╔═══╝ ██╔══██╗██║██║╚██╗██║   ██║   
 ██║     ╚██████╔╝╚██████╔╝   ██║   ██║     ██║  ██║██║██║ ╚████║   ██║   
 ╚═╝      ╚═════╝  ╚═════╝    ╚═╝   ╚═╝     ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝  
'''

PLATFORM_URLS: dict[str, str] = {
    "GitHub": "https://github.com/{}",
    "GitLab": "https://gitlab.com/{}",
    "Dev.to": "https://dev.to/{}",
    "HackerNews": "https://news.ycombinator.com/user?id={}",
    "Stack Overflow": "https://stackoverflow.com/users/{}",
    "Replit": "https://replit.com/@{}",
    "Codepen": "https://codepen.io/{}",
    "Kaggle": "https://www.kaggle.com/{}",
    "Reddit": "https://www.reddit.com/user/{}",
    "X / Twitter": "https://x.com/{}",
    "Instagram": "https://www.instagram.com/{}/",
    "Tumblr": "https://{}.tumblr.com",
    "Mastodon": "https://mastodon.social/@{}",
    "Medium": "https://medium.com/@{}",
    "Pinterest": "https://www.pinterest.com/{}/",
    "Behance": "https://www.behance.net/{}",
    "Dribbble": "https://dribbble.com/{}",
    "About.me": "https://about.me/{}",
    "Flickr": "https://www.flickr.com/people/{}",
    "DeviantArt": "https://www.deviantart.com/{}",
    "Letterboxd": "https://letterboxd.com/{}",
    "Chess.com": "https://www.chess.com/member/{}",
    "Steam": "https://steamcommunity.com/id/{}",
    "Twitch": "https://www.twitch.tv/{}",
    "SoundCloud": "https://soundcloud.com/{}",
    "Spotify": "https://open.spotify.com/user/{}",
    "LinkedIn": "https://www.linkedin.com/in/{}",
    "Keybase": "https://keybase.io/{}",
    "AngelList": "https://angel.co/u/{}",
}

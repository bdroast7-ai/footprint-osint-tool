// All Python source file contents for the Footprint OSINT tool

export const FILE_CONTENTS: Record<string, string> = {
  "footprint/__init__.py": `"""
Footprint — Lightweight OSINT & Automation CLI Tool
Author: Your Name
License: MIT
Version: 1.0.0
"""

__version__ = "1.0.0"
__author__ = "Your Name"
__license__ = "MIT"
__description__ = "Lightweight, high-performance OSINT and automation CLI tool"
`,

  "footprint/cli.py": `"""
footprint/cli.py
─────────────────────────────────────────────────────────────────────────────
Entrypoint for the Footprint CLI tool.
Handles argument parsing, terminal UI layout via Rich, and orchestrates
calls to individual OSINT modules.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path
from typing import Optional

from rich import box
from rich.align import Align
from rich.columns import Columns
from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    MofNCompleteColumn,
    Progress,
    SpinnerColumn,
    TaskProgressColumn,
    TextColumn,
    TimeElapsedColumn,
)
from rich.style import Style
from rich.table import Table
from rich.text import Text

from footprint.modules.metadata import MetadataResult, extract_metadata
from footprint.modules.username import UsernameResult, scan_username
from footprint.utils.helpers import BANNER, PLATFORM_URLS, VERSION

# ── Console singleton ──────────────────────────────────────────────────────
console = Console(highlight=False)


# ══════════════════════════════════════════════════════════════════════════════
#  VISUAL COMPONENTS
# ══════════════════════════════════════════════════════════════════════════════

def print_banner() -> None:
    """Render the Footprint ASCII banner inside a styled Rich Panel."""
    banner_text = Text(BANNER, style="bold green", justify="center")
    version_line = Text(f"  v{VERSION}  |  OSINT & Automation Framework  |  MIT License",
                        style="dim cyan", justify="center")

    panel = Panel(
        Align.center(banner_text + Text("\\n") + version_line),
        border_style="green",
        box=box.DOUBLE_EDGE,
        padding=(1, 4),
    )
    console.print()
    console.print(panel)
    console.print()


def build_username_table(results: list[UsernameResult]) -> Table:
    """
    Build a colour-coded Rich Table for username scan results.

    Args:
        results: List of UsernameResult dataclass instances.

    Returns:
        A fully populated rich.table.Table ready for printing.
    """
    table = Table(
        title="[bold cyan]Username Reconnaissance Report[/bold cyan]",
        box=box.ROUNDED,
        border_style="cyan",
        header_style="bold magenta",
        show_lines=True,
        expand=False,
    )

    table.add_column("  Platform", style="bold white", min_width=16, no_wrap=True)
    table.add_column("Status", justify="center", min_width=12)
    table.add_column("Profile URL", min_width=42, overflow="fold")

    found_count = 0
    for result in sorted(results, key=lambda r: (not r.found, r.platform)):
        if result.found:
            found_count += 1
            status_cell = Text("● FOUND", style="bold green")
            url_cell    = Text(result.url, style="underline bright_green")
            row_style   = Style(bgcolor="")
        else:
            status_cell = Text("○ NOT FOUND", style="dim white")
            url_cell    = Text(result.url, style="dim white strike")
            row_style   = Style(dim=True)

        table.add_row(
            Text(f"  {result.platform}", style="bold white" if result.found else "dim white"),
            status_cell,
            url_cell,
            style=row_style,
        )

    # Summary footer
    total = len(results)
    missing = total - found_count
    table.caption = (
        f"[bold green]{found_count} found[/bold green]  ·  "
        f"[dim white]{missing} not found[/dim white]  ·  "
        f"[cyan]{total} platforms scanned[/cyan]"
    )
    return table


def build_metadata_table(result: MetadataResult) -> Table:
    """
    Build a sleek key-value Rich Table for image metadata results.

    Args:
        result: MetadataResult dataclass instance.

    Returns:
        A fully populated rich.table.Table ready for printing.
    """
    table = Table(
        title=f"[bold cyan]Image Metadata Report · [/bold cyan][italic]{result.filename}[/italic]",
        box=box.ROUNDED,
        border_style="cyan",
        header_style="bold magenta",
        show_lines=True,
        expand=False,
        min_width=60,
    )

    table.add_column("Field", style="bold yellow", min_width=24, no_wrap=True)
    table.add_column("Value", min_width=44, overflow="fold")

    def add_row(key: str, value: Optional[str], sensitive: bool = False) -> None:
        if value:
            style = "bold red" if sensitive else "bright_white"
            table.add_row(key, Text(value, style=style))
        else:
            table.add_row(key, Text("—  not available", style="dim white"))

    # ── Device & Software ───────────────────────────────────────────────
    add_row("📷  Camera Make",    result.make)
    add_row("📷  Camera Model",   result.model)
    add_row("🖥  Software",        result.software)
    add_row("📅  Date / Time",    result.datetime_original)

    # ── GPS Intelligence ────────────────────────────────────────────────
    add_row("🌐  Latitude",       result.latitude)
    add_row("🌐  Longitude",      result.longitude)
    add_row("🗺  Altitude",       result.altitude)

    if result.maps_url:
        table.add_row(
            "📍  [bold red]Google Maps URL[/bold red]",
            Text(result.maps_url, style="underline bold red"),
        )
    else:
        add_row("📍  Google Maps URL", None)

    table.caption = (
        "[bold red]⚠  GPS data can precisely identify photo location.[/bold red]"
        if result.maps_url else
        "[dim]No GPS coordinates found in this image.[/dim]"
    )
    return table


# ══════════════════════════════════════════════════════════════════════════════
#  ASYNC ORCHESTRATION
# ══════════════════════════════════════════════════════════════════════════════

async def run_username_scan(username: str) -> list[UsernameResult]:
    """
    Drive the async username cross-reference scan with a live progress bar.

    Args:
        username: The target username string to search.

    Returns:
        List of UsernameResult objects after all requests complete.
    """
    platforms = list(PLATFORM_URLS.keys())
    results: list[UsernameResult] = []

    progress = Progress(
        SpinnerColumn(spinner_name="dots2", style="bold green"),
        TextColumn("[bold cyan]{task.description}"),
        BarColumn(bar_width=36, style="green", complete_style="bold green"),
        MofNCompleteColumn(),
        TaskProgressColumn(),
        TimeElapsedColumn(),
        console=console,
        transient=False,
    )

    console.rule("[bold green]  Username Intelligence Scan  ", style="green")
    console.print(f"  [dim]Target:[/dim] [bold bright_white]{username}[/bold bright_white]\\n")

    with progress:
        task = progress.add_task(
            f"Scanning [bold green]{username}[/bold green] across [cyan]{len(platforms)}[/cyan] platforms …",
            total=len(platforms),
        )

        async def _scan_and_update(platform: str) -> UsernameResult:
            result = await scan_username(username, platform, PLATFORM_URLS[platform])
            progress.advance(task)
            progress.update(task, description=(
                f"Scanning [bold green]{username}[/bold green] — "
                f"last: [cyan]{platform}[/cyan]"
            ))
            return result

        tasks = [_scan_and_update(p) for p in platforms]
        results = list(await asyncio.gather(*tasks))

    console.print()
    return results


# ══════════════════════════════════════════════════════════════════════════════
#  ARGUMENT PARSER
# ══════════════════════════════════════════════════════════════════════════════

def build_parser() -> argparse.ArgumentParser:
    """Configure and return the CLI argument parser."""
    parser = argparse.ArgumentParser(
        prog="footprint",
        description="Footprint — Lightweight OSINT & Automation CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\\n"
            "  footprint --username johndoe\\n"
            "  footprint --image /path/to/photo.jpg\\n"
            "  footprint --username johndoe --image photo.jpg\\n"
        ),
    )
    parser.add_argument(
        "--username", "-u",
        metavar="USERNAME",
        type=str,
        help="Cross-reference a username across major online platforms.",
    )
    parser.add_argument(
        "--image", "-i",
        metavar="IMAGE_PATH",
        type=str,
        help="Extract EXIF/GPS metadata from a JPEG or PNG image file.",
    )
    parser.add_argument(
        "--version", "-v",
        action="version",
        version=f"Footprint v{VERSION}",
    )
    return parser


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN ENTRYPOINT
# ══════════════════════════════════════════════════════════════════════════════

def main() -> None:
    """Primary CLI entrypoint — parse args, render UI, run modules."""
    parser = build_parser()
    args   = parser.parse_args()

    # Always show the banner
    print_banner()

    # Guard: require at least one module flag
    if not args.username and not args.image:
        console.print(
            Panel(
                "[yellow]  No target specified. Use [bold]--username[/bold] or [bold]--image[/bold].[/yellow]\\n"
                "  Run [bold cyan]footprint --help[/bold cyan] for full usage.",
                title="[bold red]⚠  Missing Arguments[/bold red]",
                border_style="yellow",
                box=box.ROUNDED,
            )
        )
        sys.exit(1)

    # ── Username Module ──────────────────────────────────────────────────
    if args.username:
        results = asyncio.run(run_username_scan(args.username))
        table   = build_username_table(results)
        console.print(Align.center(table))
        console.print()

    # ── Metadata Module ──────────────────────────────────────────────────
    if args.image:
        image_path = Path(args.image)
        console.rule("[bold green]  Image Metadata Analysis  ", style="green")
        console.print(f"  [dim]File:[/dim] [bold bright_white]{image_path}[/bold bright_white]\\n")

        if not image_path.exists():
            console.print(f"  [bold red]✗ File not found:[/bold red] {image_path}")
            sys.exit(1)

        result = extract_metadata(image_path)
        table  = build_metadata_table(result)
        console.print(Align.center(table))
        console.print()

    console.rule("[dim green]  Footprint scan complete  ", style="dim green")
    console.print()


if __name__ == "__main__":
    main()
`,

  "footprint/modules/__init__.py": `"""
footprint.modules
─────────────────────────────────────────────────────────────────
Public module registry for Footprint OSINT modules.
Each sub-module is independently importable for use in scripts
or third-party integrations.
─────────────────────────────────────────────────────────────────
"""

from footprint.modules.metadata import MetadataResult, extract_metadata
from footprint.modules.username import UsernameResult, scan_username

__all__ = [
    "UsernameResult",
    "scan_username",
    "MetadataResult",
    "extract_metadata",
]
`,

  "footprint/modules/username.py": `"""
footprint/modules/username.py
─────────────────────────────────────────────────────────────────────────────
Async Username Cross-Referencer
────────────────────────────────────────────────────────────────────────────

Uses asyncio + httpx.AsyncClient to fire concurrent HTTP GET requests
against a curated list of social/developer platforms and determine whether
a given username exists on each one.

Edge-case handling strategy
───────────────────────────
• HTTP 200 + "not found" body text  → NOT FOUND  (checked per-platform)
• HTTP 404 / 410 / 301→404          → NOT FOUND
• HTTP 200 with no false-positive   → FOUND
• Timeout / ConnectionError         → NOT FOUND  (logged as TIMEOUT)
• Redirect to homepage              → NOT FOUND  (some platforms do this)
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Optional

import httpx


# ══════════════════════════════════════════════════════════════════════════════
#  DATA MODEL
# ══════════════════════════════════════════════════════════════════════════════

@dataclass(frozen=True, slots=True)
class UsernameResult:
    """
    Immutable result object for a single platform username lookup.

    Attributes:
        platform:   Human-readable platform name (e.g. "GitHub").
        url:        The full URL that was checked.
        found:      True if the profile appears to exist.
        status:     HTTP status code returned, or 0 on network error.
        error:      Optional error message for failed requests.
    """
    platform: str
    url:      str
    found:    bool
    status:   int
    error:    Optional[str] = field(default=None)

    def __str__(self) -> str:
        indicator = "✓" if self.found else "✗"
        return f"[{indicator}] {self.platform:<18} {self.url}"


# ══════════════════════════════════════════════════════════════════════════════
#  FALSE-POSITIVE DETECTION
# ══════════════════════════════════════════════════════════════════════════════

# Platforms that return HTTP 200 even for missing users, with identifying
# "not found" strings in the response body.
_BODY_NOT_FOUND_SIGNALS: dict[str, list[str]] = {
    "Medium": [
        "404",
        "Page not found",
        "No results for",
    ],
    "Dev.to": [
        "404",
        "Page not found",
        "The page you were looking for doesn't exist",
    ],
    "Letterboxd": [
        "Sorry, we can't find that page",
        "Page not found",
    ],
    "Tumblr": [
        "There's nothing here",
        "not-found",
    ],
    "About.me": [
        "We couldn't find that page",
    ],
}

# Known redirect destinations that indicate a missing user (platform homepage).
_REDIRECT_NOT_FOUND_URLS: dict[str, list[str]] = {
    "Instagram": [
        "https://www.instagram.com/",
        "https://instagram.com/",
    ],
    "Pinterest": [
        "https://www.pinterest.com/",
    ],
}

# Default timeout in seconds for each individual request
_TIMEOUT_SECONDS: float = 10.0

# Maximum concurrent connections
_MAX_CONNECTIONS: int = 25


# ══════════════════════════════════════════════════════════════════════════════
#  CORE SCANNER
# ══════════════════════════════════════════════════════════════════════════════

async def scan_username(
    username: str,
    platform: str,
    url_template: str,
    *,
    timeout: float = _TIMEOUT_SECONDS,
    session: Optional[httpx.AsyncClient] = None,
) -> UsernameResult:
    """
    Perform a single async HTTP GET request to check if *username* exists
    on *platform*.

    Args:
        username:     The target username string.
        platform:     Human-readable name of the platform.
        url_template: URL string with a '{}' placeholder for the username,
                      OR a pre-formatted URL (no placeholder).
        timeout:      Per-request timeout in seconds.
        session:      Optional shared httpx.AsyncClient (reuses connections).

    Returns:
        A UsernameResult with found=True/False, status code, and full URL.
    """
    # Format the URL (some templates use {}, some are already formatted)
    profile_url = url_template.format(username) if "{}" in url_template else url_template + username

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    }

    _owns_session = session is None
    client = session or httpx.AsyncClient(
        follow_redirects=True,
        timeout=httpx.Timeout(timeout),
        limits=httpx.Limits(max_connections=_MAX_CONNECTIONS),
        headers=headers,
    )

    try:
        response = await client.get(profile_url)
        status   = response.status_code
        final_url = str(response.url)

        # ── Redirect-to-homepage check ─────────────────────────────────
        if platform in _REDIRECT_NOT_FOUND_URLS:
            for bad_url in _REDIRECT_NOT_FOUND_URLS[platform]:
                if final_url.rstrip("/") == bad_url.rstrip("/"):
                    return UsernameResult(platform=platform, url=profile_url,
                                         found=False, status=status)

        # ── HTTP 4xx / 5xx → definitely not found ─────────────────────
        if status in (404, 410, 400, 403):
            return UsernameResult(platform=platform, url=profile_url,
                                  found=False, status=status)

        # ── Body text false-positive check ────────────────────────────
        if platform in _BODY_NOT_FOUND_SIGNALS and status == 200:
            body = response.text
            if any(signal in body for signal in _BODY_NOT_FOUND_SIGNALS[platform]):
                return UsernameResult(platform=platform, url=profile_url,
                                      found=False, status=status)

        # ── 2xx → profile found ────────────────────────────────────────
        if 200 <= status < 300:
            return UsernameResult(platform=platform, url=profile_url,
                                  found=True, status=status)

        # ── Anything else (3xx without final resolution, 5xx) ─────────
        return UsernameResult(platform=platform, url=profile_url,
                              found=False, status=status)

    except httpx.TimeoutException:
        return UsernameResult(
            platform=platform, url=profile_url, found=False, status=0,
            error="Request timed out",
        )
    except httpx.ConnectError as exc:
        return UsernameResult(
            platform=platform, url=profile_url, found=False, status=0,
            error=f"Connection error: {exc}",
        )
    except httpx.RequestError as exc:
        return UsernameResult(
            platform=platform, url=profile_url, found=False, status=0,
            error=f"Request error: {exc}",
        )
    finally:
        if _owns_session:
            await client.aclose()


async def scan_username_bulk(
    username: str,
    platforms: dict[str, str],
    *,
    timeout: float = _TIMEOUT_SECONDS,
) -> list[UsernameResult]:
    """
    Concurrently scan *username* across all entries in *platforms*.

    This creates a single shared httpx.AsyncClient for connection pooling
    and fires all requests simultaneously via asyncio.gather.

    Args:
        username:  Target username.
        platforms: Dict mapping platform name → URL template.
        timeout:   Per-request timeout in seconds.

    Returns:
        List of UsernameResult objects (order matches platforms.keys()).
    """
    limits = httpx.Limits(
        max_connections=_MAX_CONNECTIONS,
        max_keepalive_connections=10,
    )
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
    }

    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=httpx.Timeout(timeout),
        limits=limits,
        headers=headers,
    ) as client:
        coros = [
            scan_username(username, platform, url_tpl, timeout=timeout, session=client)
            for platform, url_tpl in platforms.items()
        ]
        return list(await asyncio.gather(*coros))
`,

  "footprint/modules/metadata.py": `"""
footprint/modules/metadata.py
─────────────────────────────────────────────────────────────────────────────
Image EXIF Metadata Extractor
─────────────────────────────────────────────────────────────────────────────

Uses Pillow (PIL) to open JPEG / PNG images and extract:
  • Device information   — Make, Model, Software
  • Temporal data        — DateTimeOriginal
  • GPS intelligence     — Latitude, Longitude, Altitude
  • Google Maps URL      — Automatically constructed when GPS data present

GPS Conversion
──────────────
Raw EXIF GPS data is stored as tuples of IFDRational values representing
degrees, minutes, and seconds. This module converts them to decimal degrees:

    decimal = degrees + (minutes / 60) + (seconds / 3600)

If the reference is 'S' (South) or 'W' (West), the result is negated.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from PIL import Image
from PIL.ExifTags import GPSTAGS, TAGS


# ══════════════════════════════════════════════════════════════════════════════
#  DATA MODEL
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class MetadataResult:
    """
    Structured container for all extracted image metadata.

    Attributes:
        filename:           Original image filename.
        make:               Camera manufacturer (e.g. "Apple").
        model:              Camera model (e.g. "iPhone 14 Pro").
        software:           Processing software (e.g. "Lightroom 6.0").
        datetime_original:  Capture timestamp from EXIF.
        latitude:           Human-readable latitude string with direction.
        longitude:          Human-readable longitude string with direction.
        altitude:           Altitude in metres above sea level.
        latitude_decimal:   Decimal-degree latitude (negative = South).
        longitude_decimal:  Decimal-degree longitude (negative = West).
        maps_url:           Google Maps URL if GPS coords are present.
        raw_exif:           Full dictionary of all decoded EXIF tags.
    """
    filename:           str
    make:               Optional[str]   = None
    model:              Optional[str]   = None
    software:           Optional[str]   = None
    datetime_original:  Optional[str]   = None
    latitude:           Optional[str]   = None
    longitude:          Optional[str]   = None
    altitude:           Optional[str]   = None
    latitude_decimal:   Optional[float] = None
    longitude_decimal:  Optional[float] = None
    maps_url:           Optional[str]   = None
    raw_exif:           dict            = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        if self.raw_exif is None:
            self.raw_exif = {}


# ══════════════════════════════════════════════════════════════════════════════
#  GPS CONVERSION HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _rational_to_float(value: object) -> float:
    """
    Convert an IFDRational or (numerator, denominator) tuple to a float.

    Pillow ≥ 9.x stores GPS sub-components as IFDRational objects that
    support division directly; older versions use plain tuples.

    Args:
        value: IFDRational, tuple, int, or float.

    Returns:
        Float representation of the value.
    """
    if hasattr(value, "numerator"):          # IFDRational
        return float(value.numerator) / float(value.denominator)
    if isinstance(value, tuple):
        num, den = value
        return float(num) / float(den) if den else 0.0
    return float(value)


def _dms_to_decimal(dms_tuple: tuple, ref: str) -> float:
    """
    Convert a (degrees, minutes, seconds) EXIF GPS tuple to decimal degrees.

    Args:
        dms_tuple: Three-element tuple of IFDRational / tuple values.
        ref:       Cardinal reference string — 'N', 'S', 'E', or 'W'.

    Returns:
        Signed decimal-degree float.
    """
    degrees = _rational_to_float(dms_tuple[0])
    minutes = _rational_to_float(dms_tuple[1])
    seconds = _rational_to_float(dms_tuple[2])

    decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)

    if ref.upper() in ("S", "W"):
        decimal = -decimal

    return round(decimal, 7)


def _extract_gps_info(gps_ifd: dict) -> dict[str, object]:
    """
    Decode a raw GPS IFD dictionary using Pillow's GPSTAGS lookup.

    Args:
        gps_ifd: Raw {tag_id: value} dict from _getexif().

    Returns:
        Decoded {tag_name: value} dict (e.g. {'GPSLatitude': (...), ...}).
    """
    decoded: dict[str, object] = {}
    for tag_id, value in gps_ifd.items():
        tag_name = GPSTAGS.get(tag_id, f"GPS_{tag_id}")
        decoded[tag_name] = value
    return decoded


# ══════════════════════════════════════════════════════════════════════════════
#  PUBLIC API
# ══════════════════════════════════════════════════════════════════════════════

def extract_metadata(image_path: Path) -> MetadataResult:
    """
    Open *image_path* with Pillow and extract all available EXIF metadata.

    Supports JPEG and PNG formats. PNG files rarely contain EXIF data;
    the function handles this gracefully and returns whatever is available.

    Args:
        image_path: pathlib.Path to the image file.

    Returns:
        Populated MetadataResult dataclass.

    Raises:
        FileNotFoundError: If the file does not exist.
        OSError:           If Pillow cannot open the file.
    """
    result = MetadataResult(filename=image_path.name)

    with Image.open(image_path) as img:
        # ── Retrieve raw EXIF data ─────────────────────────────────────
        exif_data = img._getexif()  # type: ignore[attr-defined]

        if exif_data is None:
            return result  # No EXIF — return empty result

        # ── Decode all standard EXIF tags ─────────────────────────────
        decoded_exif: dict[str, object] = {}
        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, f"Tag_{tag_id}")
            decoded_exif[tag_name] = value

        result.raw_exif = decoded_exif

        # ── Device & software fields ───────────────────────────────────
        result.make              = _clean_str(decoded_exif.get("Make"))
        result.model             = _clean_str(decoded_exif.get("Model"))
        result.software          = _clean_str(decoded_exif.get("Software"))
        result.datetime_original = _clean_str(
            decoded_exif.get("DateTimeOriginal") or decoded_exif.get("DateTime")
        )

        # ── GPS block ─────────────────────────────────────────────────
        gps_ifd_tag = next(
            (v for k, v in decoded_exif.items() if "GPS" in str(k) and isinstance(v, dict)),
            None,
        )
        # Pillow stores the GPS IFD under the tag name "GPSInfo"
        gps_ifd = decoded_exif.get("GPSInfo") or gps_ifd_tag

        if gps_ifd and isinstance(gps_ifd, dict):
            gps = _extract_gps_info(gps_ifd)

            lat_dms = gps.get("GPSLatitude")
            lat_ref = str(gps.get("GPSLatitudeRef", "N"))
            lon_dms = gps.get("GPSLongitude")
            lon_ref = str(gps.get("GPSLongitudeRef", "E"))
            alt_raw = gps.get("GPSAltitude")

            if lat_dms and lon_dms:
                lat_dec = _dms_to_decimal(lat_dms, lat_ref)
                lon_dec = _dms_to_decimal(lon_dms, lon_ref)

                result.latitude_decimal  = lat_dec
                result.longitude_decimal = lon_dec
                result.latitude          = f"{abs(lat_dec):.6f}° {'N' if lat_dec >= 0 else 'S'}"
                result.longitude         = f"{abs(lon_dec):.6f}° {'E' if lon_dec >= 0 else 'W'}"
                result.maps_url          = (
                    f"https://www.google.com/maps/search/?api=1&query={lat_dec},{lon_dec}"
                )

            if alt_raw is not None:
                try:
                    alt_metres = _rational_to_float(alt_raw)
                    result.altitude = f"{alt_metres:.1f} m"
                except (ZeroDivisionError, TypeError):
                    pass

    return result


# ══════════════════════════════════════════════════════════════════════════════
#  INTERNAL HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _clean_str(value: object) -> Optional[str]:
    """
    Safely cast an EXIF value to a stripped string, or return None.

    Args:
        value: Raw EXIF value (may be bytes, int, str, or None).

    Returns:
        Stripped string or None.
    """
    if value is None:
        return None
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace").strip().rstrip("\\x00")
    return str(value).strip() or None
`,

  "footprint/utils/__init__.py": `"""
footprint.utils
────────────────────────────────
Utility package for Footprint.
"""
`,

  "footprint/utils/helpers.py": `"""
footprint/utils/helpers.py
─────────────────────────────────────────────────────────────────────────────
Shared constants, configuration, and the platform URL registry.

To add a new platform:
  1. Add an entry to PLATFORM_URLS with the platform name as key and the
     URL template (with '{}' for username) as value.
  2. If the platform returns HTTP 200 for missing users, add body-text
     detection signals to _BODY_NOT_FOUND_SIGNALS in username.py.

That's it — no other changes required.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

# ══════════════════════════════════════════════════════════════════════════════
#  VERSION & METADATA
# ══════════════════════════════════════════════════════════════════════════════

VERSION: str = "1.0.0"
AUTHOR:  str = "Your Name"

# ══════════════════════════════════════════════════════════════════════════════
#  ASCII BANNER
# ══════════════════════════════════════════════════════════════════════════════

BANNER: str = r"""
 ███████╗ ██████╗  ██████╗ ████████╗██████╗ ██████╗ ██╗███╗   ██╗████████╗
 ██╔════╝██╔═══██╗██╔═══██╗╚══██╔══╝██╔══██╗██╔══██╗██║████╗  ██║╚══██╔══╝
 █████╗  ██║   ██║██║   ██║   ██║   ██████╔╝██████╔╝██║██╔██╗ ██║   ██║   
 ██╔══╝  ██║   ██║██║   ██║   ██║   ██╔═══╝ ██╔══██╗██║██║╚██╗██║   ██║   
 ██║     ╚██████╔╝╚██████╔╝   ██║   ██║     ██║  ██║██║██║ ╚████║   ██║   
 ╚═╝      ╚═════╝  ╚═════╝    ╚═╝   ╚═╝     ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝  
"""

# ══════════════════════════════════════════════════════════════════════════════
#  PLATFORM URL REGISTRY
# ══════════════════════════════════════════════════════════════════════════════
# Format: "Platform Name" → "URL template with {} for username"
# Add or remove platforms freely — the scanner picks them up automatically.

PLATFORM_URLS: dict[str, str] = {
    # ── Developer / Technical ────────────────────────────────────────────
    "GitHub":           "https://github.com/{}",
    "GitLab":           "https://gitlab.com/{}",
    "Dev.to":           "https://dev.to/{}",
    "HackerNews":       "https://news.ycombinator.com/user?id={}",
    "Stack Overflow":   "https://stackoverflow.com/users/{}",
    "Replit":           "https://replit.com/@{}",
    "Codepen":          "https://codepen.io/{}",
    "Kaggle":           "https://www.kaggle.com/{}",

    # ── Social Networks ──────────────────────────────────────────────────
    "Reddit":           "https://www.reddit.com/user/{}",
    "X / Twitter":      "https://x.com/{}",
    "Instagram":        "https://www.instagram.com/{}/",
    "Tumblr":           "https://{}.tumblr.com",
    "Mastodon":         "https://mastodon.social/@{}",

    # ── Creative / Portfolio ─────────────────────────────────────────────
    "Medium":           "https://medium.com/@{}",
    "Pinterest":        "https://www.pinterest.com/{}/",
    "Behance":          "https://www.behance.net/{}",
    "Dribbble":         "https://dribbble.com/{}",
    "About.me":         "https://about.me/{}",
    "Flickr":           "https://www.flickr.com/people/{}",
    "DeviantArt":       "https://www.deviantart.com/{}",

    # ── Entertainment / Gaming ───────────────────────────────────────────
    "Letterboxd":       "https://letterboxd.com/{}",
    "Chess.com":        "https://www.chess.com/member/{}",
    "Steam":            "https://steamcommunity.com/id/{}",
    "Twitch":           "https://www.twitch.tv/{}",
    "SoundCloud":       "https://soundcloud.com/{}",
    "Spotify":          "https://open.spotify.com/user/{}",

    # ── Professional ────────────────────────────────────────────────────
    "LinkedIn":         "https://www.linkedin.com/in/{}",
    "Keybase":          "https://keybase.io/{}",
    "AngelList":        "https://angel.co/u/{}",
}

# ══════════════════════════════════════════════════════════════════════════════
#  HTTP CONFIGURATION DEFAULTS
# ══════════════════════════════════════════════════════════════════════════════

HTTP_TIMEOUT:        float = 10.0   # Seconds per request
HTTP_MAX_CONN:       int   = 25     # Max simultaneous connections
HTTP_RETRY_LIMIT:    int   = 2      # Retry attempts on timeout

# ══════════════════════════════════════════════════════════════════════════════
#  SUPPORTED MEDIA TYPES
# ══════════════════════════════════════════════════════════════════════════════

SUPPORTED_IMAGE_EXTENSIONS: frozenset[str] = frozenset({
    ".jpg", ".jpeg", ".png", ".tiff", ".tif", ".webp",
})
`,

  "requirements.txt": `# Footprint — OSINT CLI Tool
# Python 3.10+ required
# Install with: pip install -r requirements.txt

# ── Core HTTP client (async, HTTP/2 support) ──────────────────────────────
httpx[http2]>=0.27.0

# ── Terminal UI framework ─────────────────────────────────────────────────
rich>=13.7.0

# ── Image & EXIF processing ───────────────────────────────────────────────
Pillow>=10.3.0

# ── Optional: faster event loop (recommended for production) ──────────────
# uvloop>=0.19.0   # Uncomment on Linux/macOS for ~2× speed improvement
`,

  "README.md": `<div align="center">

\`\`\`
 ███████╗ ██████╗  ██████╗ ████████╗██████╗ ██████╗ ██╗███╗   ██╗████████╗
 ██╔════╝██╔═══██╗██╔═══██╗╚══██╔══╝██╔══██╗██╔══██╗██║████╗  ██║╚══██╔══╝
 █████╗  ██║   ██║██║   ██║   ██║   ██████╔╝██████╔╝██║██╔██╗ ██║   ██║   
 ██╔══╝  ██║   ██║██║   ██║   ██║   ██╔═══╝ ██╔══██╗██║██║╚██╗██║   ██║   
 ██║     ╚██████╔╝╚██████╔╝   ██║   ██║     ██║  ██║██║██║ ╚████║   ██║   
 ╚═╝      ╚═════╝  ╚═════╝    ╚═╝   ╚═╝     ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝  
\`\`\`

**Lightweight · High-Performance · Modular**

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square&logo=python)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Async](https://img.shields.io/badge/Async-httpx%20%2B%20asyncio-cyan?style=flat-square)](https://www.python-httpx.org/)
[![UI](https://img.shields.io/badge/Terminal%20UI-Rich-magenta?style=flat-square)](https://rich.readthedocs.io/)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)]()

*Footprint is a modular, async-first Open-Source Intelligence (OSINT) command-line tool  
for digital investigators, penetration testers, and privacy researchers.*

</div>

---

## ✨ Features

| Module | Description |
|---|---|
| 🔍 **Username Recon** | Concurrently checks a username across **28+ platforms** using async HTTP |
| 🖼 **Image Metadata** | Extracts EXIF data, GPS coordinates, and generates a Google Maps link |
| 🎨 **Rich Terminal UI** | Hacker-themed panels, live progress bars, and colour-coded result tables |
| ⚡ **Async Concurrency** | All network I/O is non-blocking via \`asyncio\` + \`httpx.AsyncClient\` |
| 🧩 **Modular Design** | Drop in new OSINT modules with zero changes to the core |

---

## 📦 Installation

### Prerequisites

- **Python 3.10+**
- **pip** package manager

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/yourname/footprint.git
cd footprint
\`\`\`

### 2. Create a Virtual Environment (Recommended)

\`\`\`bash
python -m venv .venv
source .venv/bin/activate      # Linux / macOS
.venv\\Scripts\\activate.bat    # Windows
\`\`\`

### 3. Install Dependencies

\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 4. Install Footprint as a CLI Tool

\`\`\`bash
pip install -e .
\`\`\`

---

## 🚀 Usage

### Username Cross-Reference

\`\`\`bash
# Scan a single username across all 28+ platforms
footprint --username johndoe

# Short flag
footprint -u johndoe
\`\`\`

**Example Output:**
\`\`\`
╭─────────────────────────────────────────────────────────────╮
│         Username Reconnaissance Report                      │
├──────────────────┬─────────────┬───────────────────────────┤
│ Platform         │   Status    │ Profile URL               │
├──────────────────┼─────────────┼───────────────────────────┤
│ GitHub           │ ● FOUND     │ https://github.com/...    │
│ Reddit           │ ● FOUND     │ https://reddit.com/...    │
│ Instagram        │ ○ NOT FOUND │ https://instagram.com/... │
╰─────────────────────────────────────────────────────────────╯
  12 found · 16 not found · 28 platforms scanned
\`\`\`

---

### Image Metadata Extraction

\`\`\`bash
# Analyse a JPEG photo
footprint --image /path/to/photo.jpg

# Short flag
footprint -i photo.jpg
\`\`\`

**Example Output:**
\`\`\`
╭─────────────────────────────────────────────────────────╮
│   Image Metadata Report · photo.jpg                     │
├──────────────────────────┬──────────────────────────────┤
│ Field                    │ Value                        │
├──────────────────────────┼──────────────────────────────┤
│ 📷 Camera Make           │ Apple                        │
│ 📷 Camera Model          │ iPhone 14 Pro                │
│ 📅 Date / Time           │ 2024:03:15 14:22:11          │
│ 🌐 Latitude              │ 51.501364° N                 │
│ 🌐 Longitude             │ 0.141890° W                  │
│ 📍 Google Maps URL       │ https://maps.google.com/...  │
╰──────────────────────────┴──────────────────────────────╯
  ⚠ GPS data can precisely identify photo location.
\`\`\`

---

### Combined Scan

\`\`\`bash
footprint --username johndoe --image photo.jpg
\`\`\`

---

## 🗂 Project Structure

\`\`\`
footprint/
├── footprint/
│   ├── __init__.py          # Package metadata & version
│   ├── cli.py               # Entrypoint, Rich UI, argparse
│   ├── modules/
│   │   ├── __init__.py      # Module registry
│   │   ├── username.py      # Async username cross-referencer
│   │   └── metadata.py      # EXIF / GPS metadata extractor
│   └── utils/
│       ├── __init__.py
│       └── helpers.py       # Constants, platform URL registry
├── requirements.txt
└── README.md
\`\`\`

---

## ➕ Adding a New OSINT Module

1. Create \`footprint/modules/yourmodule.py\`
2. Define a \`dataclass\` result type and an \`async def\` main function
3. Register it in \`footprint/modules/__init__.py\`
4. Add a new \`argparse\` argument in \`cli.py\` and wire it up

**Example — adding a new platform to username scanner:**

\`\`\`python
# In footprint/utils/helpers.py → PLATFORM_URLS
"Lobsters": "https://lobste.rs/~{}",
"Polywork": "https://polywork.com/{}",
\`\`\`

---

## ⚙️ Roadmap

- [ ] **DNS Enumeration** module — subdomain discovery via async DNS
- [ ] **Email OSINT** module — breach database lookup, MX record analysis
- [ ] **WHOIS Lookup** module — domain registration history
- [ ] **Reverse Image Search** integration
- [ ] **JSON / CSV export** for all module results
- [ ] **Tor / SOCKS5 proxy** support for anonymised scanning
- [ ] **Config file** support (\`~/.footprint/config.toml\`)
- [ ] **Docker image** for containerised deployment

---

## ⚖️ Legal & Ethical Use

> **Footprint is intended for legitimate security research, digital forensics,  
> and privacy auditing on systems and accounts you own or have explicit  
> permission to investigate.**

- Do **not** use this tool to harass, stalk, or investigate individuals without consent.
- Respect each platform's Terms of Service and rate-limiting policies.
- The authors assume no liability for misuse.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Made with ⚡ and 🐍 · <a href="https://github.com/yourname/footprint">GitHub</a>
</div>
`,
};

// File tree structure for display
export interface FileNode {
  name: string;
  type: "file" | "dir";
  children?: FileNode[];
  path?: string;
  language?: string;
}

export const FILE_TREE: FileNode[] = [
  {
    name: "footprint/", type: "dir", children: [
      {
        name: "footprint/", type: "dir", children: [
          { name: "__init__.py", type: "file", path: "footprint/__init__.py", language: "python" },
          { name: "cli.py", type: "file", path: "footprint/cli.py", language: "python" },
          {
            name: "modules/", type: "dir", children: [
              { name: "__init__.py", type: "file", path: "footprint/modules/__init__.py", language: "python" },
              { name: "username.py", type: "file", path: "footprint/modules/username.py", language: "python" },
              { name: "metadata.py", type: "file", path: "footprint/modules/metadata.py", language: "python" },
            ]
          },
          {
            name: "utils/", type: "dir", children: [
              { name: "__init__.py", type: "file", path: "footprint/utils/__init__.py", language: "python" },
              { name: "helpers.py", type: "file", path: "footprint/utils/helpers.py", language: "python" },
            ]
          },
        ]
      },
      { name: "requirements.txt", type: "file", path: "requirements.txt", language: "text" },
      { name: "README.md", type: "file", path: "README.md", language: "markdown" },
    ]
  }
];

export const PLATFORMS = [
  { name: "GitHub", category: "Dev", url: "github.com/{}" },
  { name: "GitLab", category: "Dev", url: "gitlab.com/{}" },
  { name: "Dev.to", category: "Dev", url: "dev.to/{}" },
  { name: "HackerNews", category: "Dev", url: "news.ycombinator.com/user?id={}" },
  { name: "Stack Overflow", category: "Dev", url: "stackoverflow.com/users/{}" },
  { name: "Replit", category: "Dev", url: "replit.com/@{}" },
  { name: "Codepen", category: "Dev", url: "codepen.io/{}" },
  { name: "Kaggle", category: "Dev", url: "kaggle.com/{}" },
  { name: "Reddit", category: "Social", url: "reddit.com/user/{}" },
  { name: "X / Twitter", category: "Social", url: "x.com/{}" },
  { name: "Instagram", category: "Social", url: "instagram.com/{}/" },
  { name: "Tumblr", category: "Social", url: "{}.tumblr.com" },
  { name: "Mastodon", category: "Social", url: "mastodon.social/@{}" },
  { name: "Medium", category: "Creative", url: "medium.com/@{}" },
  { name: "Pinterest", category: "Creative", url: "pinterest.com/{}/" },
  { name: "Behance", category: "Creative", url: "behance.net/{}" },
  { name: "Dribbble", category: "Creative", url: "dribbble.com/{}" },
  { name: "Flickr", category: "Creative", url: "flickr.com/people/{}" },
  { name: "DeviantArt", category: "Creative", url: "deviantart.com/{}" },
  { name: "Letterboxd", category: "Entertainment", url: "letterboxd.com/{}" },
  { name: "Chess.com", category: "Entertainment", url: "chess.com/member/{}" },
  { name: "Steam", category: "Entertainment", url: "steamcommunity.com/id/{}" },
  { name: "Twitch", category: "Entertainment", url: "twitch.tv/{}" },
  { name: "SoundCloud", category: "Entertainment", url: "soundcloud.com/{}" },
  { name: "Spotify", category: "Entertainment", url: "open.spotify.com/user/{}" },
  { name: "LinkedIn", category: "Professional", url: "linkedin.com/in/{}" },
  { name: "Keybase", category: "Professional", url: "keybase.io/{}" },
  { name: "AngelList", category: "Professional", url: "angel.co/u/{}" },
];

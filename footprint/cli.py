from __future__ import annotations
import argparse
import asyncio
import sys
from pathlib import Path
from rich import box
from rich.align import Align
from rich.console import Console
from rich.panel import Panel
from rich.progress import BarColumn, MofNCompleteColumn, Progress, SpinnerColumn, TimeElapsedColumn
from rich.style import Style
from rich.table import Table
from rich.text import Text

from footprint.modules.metadata import extract_metadata
from footprint.modules.username import scan_username
from footprint.utils.helpers import BANNER, PLATFORM_URLS, VERSION

console = Console(highlight=False)

def print_banner() -> None:
    banner_text = Text(BANNER, style="bold green", justify="center")
    version_line = Text(f"  v{VERSION}  |  OSINT Engine  |  MIT License", style="dim cyan", justify="center")
    console.print(Panel(Align.center(banner_text + Text("\n") + version_line), border_style="green", box=box.DOUBLE_EDGE))

def build_username_table(results: list) -> Table:
    table = Table(title="[bold cyan]Username Reconnaissance Report[/bold cyan]", box=box.ROUNDED, border_style="cyan", show_lines=True)
    table.add_column("  Platform", style="bold white")
    table.add_column("Status", justify="center")
    table.add_column("Profile URL", overflow="fold")
    for r in sorted(results, key=lambda x: (not x.found, x.platform)):
        status_cell = Text("● FOUND", style="bold green") if r.found else Text("○ NOT FOUND", style="dim white")
        url_cell = Text(r.url, style="underline bright_green") if r.found else Text(r.url, style="dim white strike")
        table.add_row(Text(f"  {r.platform}"), status_cell, url_cell, style=Style(dim=not r.found))
    return table

async def run_username_scan(username: str) -> list:
    platforms = list(PLATFORM_URLS.keys())
    progress = Progress(SpinnerColumn(), BarColumn(), MofNCompleteColumn(), TimeElapsedColumn(), console=console)
    with progress:
        task = progress.add_task("Scanning...", total=len(platforms))
        tasks = [scan_username(username, p, PLATFORM_URLS[p]) for p in platforms]
        results = []
        for coro in asyncio.as_completed(tasks):
            res = await coro
            results.append(res)
            progress.advance(task)
    return results

def main() -> None:
    print_banner()
    parser = argparse.ArgumentParser(prog="footprint")
    parser.add_argument("--username", "-u", type=str, help="Username scan target.")
    parser.add_argument("--image", "-i", type=str, help="Image EXIF scan target.")
    args = parser.parse_args()
    if not args.username and not args.image:
        console.print("[yellow]No target specified. Run with --help for options.[/yellow]")
        sys.exit(1)
    if args.username:
        results = asyncio.run(run_username_scan(args.username))
        console.print(Align.center(build_username_table(results)))
    if args.image:
        res = extract_metadata(Path(args.image))
        console.print(f"[bold cyan]Metadata extraction complete for {res.filename}.[/bold cyan]")
        if res.maps_url:
            console.print(f"[bold red]Coordinates tracked: {res.maps_url}[/bold red]")

if __name__ == "__main__":
    main()

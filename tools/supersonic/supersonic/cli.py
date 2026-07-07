"""
SUPERSONIC CLI — Command Line Intelligence
============================================
supersonic scan    — Find every sound on the machine
supersonic report  — Show what was found
supersonic search  — Query the catalog
supersonic dupes   — Find duplicates
supersonic organize — Move files to canonical locations
supersonic export  — Export catalog for D1

Built in the DREAMCHAMBER. GORUNFREE.
"""

from __future__ import annotations
import os
import sys
import json
import shutil
from pathlib import Path
from datetime import datetime

import click
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.panel import Panel
from rich.text import Text

from .modules.scanner import SupersonicScanner
from .modules.extractor import MetadataExtractor
from .modules.fingerprinter import AudioFingerprinter
from .modules.classifier import AudioClassifier
from .cloud.d1_catalog import LocalCatalog
from .models import AudioAsset, ScanReport, AudioCategory

console = Console()

BANNER = """
[bold cyan]
  ███████╗██╗   ██╗██████╗ ███████╗██████╗ ███████╗ ██████╗ ███╗   ██╗██╗ ██████╗
  ██╔════╝██║   ██║██╔══██╗██╔════╝██╔══██╗██╔════╝██╔═══██╗████╗  ██║██║██╔════╝
  ███████╗██║   ██║██████╔╝█████╗  ██████╔╝███████╗██║   ██║██╔██╗ ██║██║██║
  ╚════██║██║   ██║██╔═══╝ ██╔══╝  ██╔══██╗╚════██║██║   ██║██║╚██╗██║██║██║
  ███████║╚██████╔╝██║     ███████╗██║  ██║███████║╚██████╔╝██║ ╚████║██║╚██████╗
  ╚══════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝ ╚═════╝
[/bold cyan]
[dim]Audio Intelligence System for NOIZY.AI | v1.0.0[/dim]
[dim]Robert Stephen Plowman | DREAMCHAMBER | 2026[/dim]
"""


def get_catalog() -> LocalCatalog:
    return LocalCatalog()


@click.group()
@click.version_option(version="1.0.0", prog_name="SUPERSONIC")
def cli():
    """SUPERSONIC — Audio Intelligence System for NOIZY.AI"""
    pass


@cli.command()
@click.argument("paths", nargs=-1, type=click.Path(exists=True))
@click.option("--deep/--quick", default=True, help="Deep scan with librosa analysis (slower) or quick metadata-only scan")
@click.option("--fingerprint/--no-fingerprint", default=True, help="Compute SHA-256 fingerprints for duplicate detection")
@click.option("--machine", default="GOD", help="Machine name for this scan")
@click.option("--include-noise/--exclude-noise", default=False, help="Include system/test audio files")
def scan(paths, deep, fingerprint, machine, include_noise):
    """Scan directories for audio files. Defaults to home directory."""
    console.print(BANNER)
    console.print(Panel("[bold green]SCAN MODE[/bold green] — Finding every sound", style="green"))

    scan_paths = list(paths) if paths else [os.path.expanduser("~")]
    console.print(f"[dim]Scanning: {', '.join(scan_paths)}[/dim]")
    console.print(f"[dim]Deep analysis: {deep} | Fingerprint: {fingerprint} | Noise: {'include' if include_noise else 'exclude'}[/dim]\n")

    # Phase 1: Discover
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Scanning directories...", total=None)

        scanner = SupersonicScanner(
            scan_paths=scan_paths,
            exclude_noise=not include_noise,
            include_empty=True,
            machine_name=machine,
        )
        report = scanner.scan()
        progress.update(task, completed=100, total=100)

    console.print(f"\n[green]Found {len(report.assets)} audio files[/green] (filtered {report.total_noise} noise, {report.total_empty} empty)\n")

    if not report.assets:
        console.print("[yellow]No audio files found. Try different paths or --include-noise[/yellow]")
        return

    # Phase 2: Extract metadata
    extractor = MetadataExtractor(use_librosa=deep)
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Extracting metadata...", total=len(report.assets))
        for i, asset in enumerate(report.assets):
            extractor.extract(asset)
            progress.update(task, advance=1)

    console.print(f"[green]Metadata extracted for {len(report.assets)} files[/green]\n")

    # Phase 3: Fingerprint
    if fingerprint:
        fp = AudioFingerprinter()
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console,
        ) as progress:
            task = progress.add_task("[cyan]Computing fingerprints...", total=len(report.assets))
            for asset in report.assets:
                fp.fingerprint(asset)
                progress.update(task, advance=1)

        report.assets = fp.find_duplicates(report.assets)
        report.total_duplicates = fp.duplicate_count
        console.print(f"[green]Fingerprinted. Found {fp.duplicate_count} duplicates[/green]\n")

    # Phase 4: Classify
    classifier = AudioClassifier()
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Classifying audio...", total=len(report.assets))
        for asset in report.assets:
            classifier.classify(asset)
            progress.update(task, advance=1)

    # Phase 5: Store in catalog
    catalog = get_catalog()
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Storing in catalog...", total=len(report.assets))
        for asset in report.assets:
            catalog.store_asset(asset)
            progress.update(task, advance=1)

    catalog.store_scan_report(report)

    # Print summary
    _print_scan_summary(report, catalog)
    catalog.close()


@cli.command()
@click.option("--format", "fmt", default="table", type=click.Choice(["table", "json"]))
def report(fmt):
    """Show catalog statistics and breakdown."""
    console.print(BANNER)

    catalog = get_catalog()
    stats = catalog.stats()

    if fmt == "json":
        console.print_json(json.dumps(stats, indent=2))
        catalog.close()
        return

    console.print(Panel(
        f"[bold]{stats['total_assets']}[/bold] audio assets | "
        f"[bold]{stats['total_size_human']}[/bold] total | "
        f"[bold]{stats['duplicates']}[/bold] duplicates",
        title="[bold cyan]SUPERSONIC CATALOG[/bold cyan]",
        style="cyan"
    ))

    # By category
    if stats["by_category"]:
        table = Table(title="By Category", show_header=True, header_style="bold magenta")
        table.add_column("Category", style="cyan")
        table.add_column("Count", justify="right", style="green")
        for cat, count in sorted(stats["by_category"].items(), key=lambda x: -x[1]):
            table.add_row(cat, str(count))
        console.print(table)

    # By project
    if stats["by_project"]:
        table = Table(title="By Project", show_header=True, header_style="bold magenta")
        table.add_column("Project", style="cyan")
        table.add_column("Count", justify="right", style="green")
        for proj, count in sorted(stats["by_project"].items(), key=lambda x: -x[1]):
            table.add_row(proj, str(count))
        console.print(table)

    # By format
    if stats["by_format"]:
        table = Table(title="By Format", show_header=True, header_style="bold magenta")
        table.add_column("Format", style="cyan")
        table.add_column("Count", justify="right", style="green")
        for fmt_name, count in sorted(stats["by_format"].items(), key=lambda x: -x[1]):
            table.add_row(fmt_name, str(count))
        console.print(table)

    catalog.close()


@cli.command()
@click.argument("query", default="")
@click.option("--category", "-c", default="", help="Filter by category")
@click.option("--project", "-p", default="", help="Filter by project")
@click.option("--format", "-f", "fmt", default="", help="Filter by format")
@click.option("--limit", "-n", default=50, help="Max results")
def search(query, category, project, fmt, limit):
    """Search the audio catalog."""
    catalog = get_catalog()
    results = catalog.search(query=query, category=category, project=project, format_=fmt, limit=limit)

    if not results:
        console.print("[yellow]No results found[/yellow]")
        catalog.close()
        return

    table = Table(title=f"Search Results ({len(results)} found)", show_header=True, header_style="bold magenta")
    table.add_column("Name", style="cyan", max_width=40)
    table.add_column("Category", style="green")
    table.add_column("Project", style="yellow")
    table.add_column("Format", style="dim")
    table.add_column("Duration", justify="right")
    table.add_column("Quality", style="dim")

    for r in results:
        duration = ""
        if r.get("duration_seconds"):
            mins = int(r["duration_seconds"] // 60)
            secs = int(r["duration_seconds"] % 60)
            duration = f"{mins}:{secs:02d}"

        quality = ""
        if r.get("sample_rate"):
            quality = f"{r['sample_rate']}Hz"
            if r.get("bit_depth"):
                quality += f"/{r['bit_depth']}bit"

        table.add_row(
            r.get("file_name", "?"),
            r.get("category", "?"),
            r.get("project", "-"),
            r.get("format", "?"),
            duration,
            quality,
        )

    console.print(table)
    catalog.close()


@cli.command()
def dupes():
    """Show duplicate audio files."""
    catalog = get_catalog()
    results = catalog.search(limit=1000)

    # Group by duplicate_group_id
    groups: dict[str, list[dict]] = {}
    for r in results:
        gid = r.get("duplicate_group_id")
        if gid:
            groups.setdefault(gid, []).append(r)

    if not groups:
        console.print("[green]No duplicates found[/green]")
        catalog.close()
        return

    console.print(Panel(f"[bold]{len(groups)}[/bold] duplicate groups found", style="yellow"))

    for gid, members in groups.items():
        table = Table(title=f"Group: {gid}", show_header=True, header_style="bold red")
        table.add_column("Primary", style="green")
        table.add_column("Path", style="dim")
        table.add_column("Size", justify="right")

        for m in members:
            is_primary = "***" if m.get("is_primary_copy") else ""
            size = LocalCatalog._human_size(m.get("file_size_bytes", 0))
            table.add_row(is_primary, m.get("file_path", "?"), size)

        console.print(table)
        console.print()

    catalog.close()


@cli.command()
@click.argument("target_root", type=click.Path())
@click.option("--dry-run/--execute", default=True, help="Preview moves without executing")
@click.option("--copy/--move", default=True, help="Copy files (safe) or move them")
def organize(target_root, dry_run, copy):
    """Organize audio files into canonical folder structure."""
    console.print(BANNER)

    catalog = get_catalog()
    results = catalog.search(limit=10000)

    if not results:
        console.print("[yellow]Catalog empty. Run 'supersonic scan' first.[/yellow]")
        catalog.close()
        return

    target = Path(target_root).expanduser().resolve()
    action = "COPY" if copy else "MOVE"
    mode = "DRY RUN" if dry_run else "EXECUTING"

    console.print(Panel(
        f"[bold]{action}[/bold] to [cyan]{target}[/cyan] | Mode: [bold {'yellow' if dry_run else 'red'}]{mode}[/bold {'yellow' if dry_run else 'red'}]",
        style="yellow" if dry_run else "red"
    ))

    moves = []
    for r in results:
        project = r.get("project")
        sub_project = r.get("sub_project")
        if not project:
            continue

        # Build target path
        dest_dir = target / project
        if sub_project:
            dest_dir = dest_dir / sub_project
        dest_file = dest_dir / r.get("file_name", "unknown")

        source = r.get("file_path", "")
        if source and str(dest_file) != source:
            moves.append((source, str(dest_file)))

    if not moves:
        console.print("[green]All files already organized. Nothing to do.[/green]")
        catalog.close()
        return

    table = Table(title=f"Planned {action}s ({len(moves)} files)", show_header=True)
    table.add_column("From", style="dim", max_width=60)
    table.add_column("To", style="cyan", max_width=60)

    for src, dst in moves[:50]:  # Show first 50
        table.add_row(src, dst)
    if len(moves) > 50:
        table.add_row(f"... and {len(moves) - 50} more", "")

    console.print(table)

    if dry_run:
        console.print(f"\n[yellow]DRY RUN — no files were moved. Use --execute to proceed.[/yellow]")
    else:
        with Progress(SpinnerColumn(), TextColumn("{task.description}"), BarColumn(), TaskProgressColumn(), console=console) as progress:
            task = progress.add_task(f"[cyan]{action.lower()}ing files...", total=len(moves))
            errors = []
            for src, dst in moves:
                try:
                    dest_path = Path(dst)
                    dest_path.parent.mkdir(parents=True, exist_ok=True)
                    if copy:
                        shutil.copy2(src, dst)
                    else:
                        shutil.move(src, dst)
                except Exception as e:
                    errors.append(f"{src}: {e}")
                progress.update(task, advance=1)

        console.print(f"\n[green]{len(moves) - len(errors)} files {action.lower()}d successfully[/green]")
        if errors:
            console.print(f"[red]{len(errors)} errors:[/red]")
            for err in errors[:10]:
                console.print(f"  [red]{err}[/red]")

    catalog.close()


@cli.command()
@click.argument("output", default="supersonic_d1_export.sql")
def export(output):
    """Export catalog as SQL for Cloudflare D1."""
    catalog = get_catalog()
    path = catalog.export_d1_sql(output)
    console.print(f"[green]Exported to {path}[/green]")
    catalog.close()


def _print_scan_summary(report: ScanReport, catalog: LocalCatalog):
    """Print a beautiful scan summary."""
    console.print()
    console.print(Panel(
        f"[bold green]SCAN COMPLETE[/bold green]\n\n"
        f"Files scanned: [bold]{report.total_files_found:,}[/bold]\n"
        f"Audio found:   [bold]{report.total_audio_files:,}[/bold]\n"
        f"Real audio:    [bold]{len(report.assets):,}[/bold]\n"
        f"Noise filtered:[bold]{report.total_noise:,}[/bold]\n"
        f"Empty files:   [bold]{report.total_empty:,}[/bold]\n"
        f"Duplicates:    [bold]{report.total_duplicates:,}[/bold]\n"
        f"Total size:    [bold]{LocalCatalog._human_size(report.total_size_bytes)}[/bold]",
        title="[bold cyan]SUPERSONIC SCAN RESULTS[/bold cyan]",
        style="cyan",
    ))

    # Category breakdown
    categories: dict[str, int] = {}
    projects: dict[str, int] = {}
    for asset in report.assets:
        cat = asset.category.value
        categories[cat] = categories.get(cat, 0) + 1
        if asset.project.project:
            proj = asset.project.project
            projects[proj] = projects.get(proj, 0) + 1

    if categories:
        table = Table(title="Classification Results", show_header=True, header_style="bold magenta")
        table.add_column("Category", style="cyan")
        table.add_column("Count", justify="right", style="green")
        for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
            table.add_row(cat, str(count))
        console.print(table)

    if projects:
        table = Table(title="Project Mapping", show_header=True, header_style="bold magenta")
        table.add_column("Project", style="yellow")
        table.add_column("Files", justify="right", style="green")
        for proj, count in sorted(projects.items(), key=lambda x: -x[1]):
            table.add_row(proj, str(count))
        console.print(table)

    # Files needing review
    needs_review = [a for a in report.assets if a.needs_review]
    if needs_review:
        console.print(f"\n[yellow]{len(needs_review)} files need human review[/yellow]")

    console.print(f"\n[dim]Catalog stored at: ~/.noizy/supersonic/catalog.db[/dim]")
    console.print(f"[dim]Run 'supersonic report' for full statistics[/dim]")
    console.print(f"[dim]Run 'supersonic organize <path> --dry-run' to preview file organization[/dim]\n")


if __name__ == "__main__":
    cli()

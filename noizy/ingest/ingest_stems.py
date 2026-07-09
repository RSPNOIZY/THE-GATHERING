from pathlib import Path

def run_ingestion_canary(input_dir: str, limit: int = 50, dry_run: bool = False):
    input_path = Path(input_dir)

    if not input_path.exists():
        raise FileNotFoundError(f"[Errno 2] No such file or directory: {input_dir}")

    print(f"[CANARY] Input directory exists: {input_path}")
    print(f"[CANARY] limit={limit}, dry_run={dry_run}")
    # TODO: real ingestion logic here

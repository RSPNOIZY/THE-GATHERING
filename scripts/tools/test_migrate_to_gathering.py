import sys
import pytest
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from migrate_to_gathering import migrate

def test_migrate_fails_without_scaffold(tmp_path, capsys):
    """Test that migration safely aborts if the destination doesn't exist."""
    src_dir = tmp_path / "src"
    dest_dir = tmp_path / "THE-GATHERING"
    src_dir.mkdir()
    
    migrate(src_dir=str(src_dir), dest_dir=str(dest_dir))
    
    captured = capsys.readouterr()
    assert "⚠️ THE-GATHERING scaffolding not found" in captured.out

def test_migrate_success_moves_and_copies(tmp_path, capsys):
    """Test that files are moved and directories are copied correctly."""
    src_dir = tmp_path / "src"
    dest_dir = tmp_path / "THE-GATHERING"
    
    src_dir.mkdir()
    dest_dir.mkdir()
    
    # Setup dummy source files
    agent_file = src_dir / "noizy_agent.py"
    agent_file.write_text("# dummy agent")
    
    # Setup dummy source directories
    profiles_dir = src_dir / "NOIZYANTHROPIC/apps/dreamchamber"
    profiles_dir.mkdir(parents=True)
    (profiles_dir / "lucy-profile.json").write_text('{"name": "Lucy"}')
    
    # Execute migration
    migrate(src_dir=str(src_dir), dest_dir=str(dest_dir))
    
    # 1. Assert file was MOVED
    assert not agent_file.exists(), "Source file should be moved, not copied"
    expected_agent_dest = dest_dir / "personas/runners/noizy_agent.py"
    assert expected_agent_dest.exists()
    assert expected_agent_dest.read_text() == "# dummy agent"
    
    # 2. Assert directory was COPIED
    expected_profile_dest = dest_dir / "personas/profiles/lucy-profile.json"
    assert expected_profile_dest.exists()
    
    captured = capsys.readouterr()
    assert "ALL SYSTEMS MIGRATED" in captured.out

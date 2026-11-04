#!/usr/bin/env python3
"""
Migration Script - Clean up old structure
Removes old files that have been migrated to new structure
"""

import os
import shutil
from pathlib import Path


def main():
    """Clean up old files after migration"""
    base_dir = Path(__file__).parent.parent
    
    print("🧹 Cleaning up old structure...\n")
    
    # Files to remove (already migrated)
    files_to_remove = [
        "hajri_css.py",  # → src/ui/styles.py
        "hajri_notify.py",  # → src/services/email_service.py
    ]
    
    # Directories to remove
    dirs_to_remove = [
        "versions",  # Old backup directory
    ]
    
    removed_files = []
    removed_dirs = []
    
    # Remove old files
    for file_name in files_to_remove:
        file_path = base_dir / file_name
        if file_path.exists():
            os.remove(file_path)
            removed_files.append(file_name)
            print(f"✅ Removed: {file_name}")
    
    # Remove old directories
    for dir_name in dirs_to_remove:
        dir_path = base_dir / dir_name
        if dir_path.exists():
            shutil.rmtree(dir_path)
            removed_dirs.append(dir_name)
            print(f"✅ Removed directory: {dir_name}")
    
    print("\nSummary:")
    print(f"   Files removed: {len(removed_files)}")
    print(f"   Directories removed: {len(removed_dirs)}")
    print("\nCleanup complete!")
    
    # Show what still needs migration
    print("\nFiles pending migration:")
    pending = [
        "hajri_utils.py → Split into multiple modules",
        "hajri_views.py → Split into view modules",
        "app.py → Refactor to use new imports"
    ]
    for item in pending:
        print(f"   ⏳ {item}")


if __name__ == "__main__":
    main()

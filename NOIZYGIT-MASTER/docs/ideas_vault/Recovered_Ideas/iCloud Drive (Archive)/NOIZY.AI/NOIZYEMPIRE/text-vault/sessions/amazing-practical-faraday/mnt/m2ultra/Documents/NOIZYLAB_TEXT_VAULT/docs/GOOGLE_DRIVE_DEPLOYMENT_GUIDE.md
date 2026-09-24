# 📤 MASTER ARCHIVE GOOGLE DRIVE DEPLOYMENT GUIDE

**Archive Location:** `/Volumes/4TBSG/MASTER_CONSOLIDATED_ARCHIVE`
**Status:** ✅ Ready for Deployment
**Date:** November 8, 2025

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Drive Setup](#google-drive-setup)
3. [Upload Methods](#upload-methods)
4. [Verification](#verification)
5. [Team Sharing](#team-sharing)
6. [Backup Strategy](#backup-strategy)

---

## Prerequisites

- ✅ Google account with write access to Google Drive
- ✅ At least 10GB free space on Google Drive
- ✅ macOS system with Python 3.7+
- ✅ Broadband connection (10+ Mbps recommended)
- ✅ Estimated upload time: 2-4 hours

---

## Google Drive Setup

### Step 1: Create Main Folder

1. Go to [Google Drive](https://drive.google.com)
2. Create new folder: **`NOIZYLAB_MASTER`**
3. Note the folder ID from URL (appears after `/folders/`)
   ```
   https://drive.google.com/drive/folders/[FOLDER_ID]
   ```

### Step 2: Prepare Archive

Master archive already consolidated in:
```
/Volumes/4TBSG/MASTER_CONSOLIDATED_ARCHIVE/
├── CORE_SYSTEMS/
├── ORCHESTRATION/
├── AUTOMATIONS/
├── PROJECTS/ (6 folders)
├── EXTENSIONS/ (3 folders)
├── WEB_INTERFACES/
├── DATABASES/
├── _DEPLOYMENT/
└── _MASTER_INDEX.md
```

---

## Upload Methods

### Option 1: Manual Drag-and-Drop (Simplest)

1. Open Google Drive in browser
2. Open `NOIZYLAB_MASTER` folder
3. Open `/Volumes/4TBSG/MASTER_CONSOLIDATED_ARCHIVE` in Finder
4. Drag folders into Google Drive browser window
5. Wait for upload to complete (2-4 hours)

**Pros:** Simple, no additional software
**Cons:** Slow for large files, limited by browser

---

### Option 2: Google Drive Sync (Recommended)

1. Install [Google Drive for Desktop](https://www.google.com/drive/download/)
2. Sign in with your Google account
3. Create sync folder on local drive
4. Copy `/Volumes/4TBSG/MASTER_CONSOLIDATED_ARCHIVE` to sync folder
5. Drive syncs automatically

**Pros:** Reliable, automatic backup, easy access
**Cons:** Requires additional disk space

---

### Option 3: Python Upload Script

Create `upload_to_gdrive.py`:

```python
#!/usr/bin/env python3
"""Upload Master Archive to Google Drive"""

import os
import sys
from pathlib import Path

# Install required package:
# pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client

from google.colab import auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

def upload_to_gdrive(local_path, folder_id):
    """Upload directory to Google Drive folder"""
    auth.authenticate_user()
    drive = build('drive', 'v3')
    
    for item in Path(local_path).rglob('*'):
        if item.is_file():
            file_metadata = {
                'name': item.name,
                'parents': [folder_id]
            }
            media = MediaFileUpload(str(item))
            file = drive.files().create(
                body=file_metadata,
                media_body=media,
                fields='id'
            ).execute()
            print(f"✅ Uploaded: {item.name}")

if __name__ == "__main__":
    local_path = "/Volumes/4TBSG/MASTER_CONSOLIDATED_ARCHIVE"
    folder_id = "YOUR_FOLDER_ID_HERE"  # Replace with actual ID
    upload_to_gdrive(local_path, folder_id)
```

**Pros:** Fast, scriptable, precise control
**Cons:** Requires setup, API authentication

---

### Option 4: Git + GitHub Release

1. Initialize git in archive:
```bash
cd /Volumes/4TBSG/MASTER_CONSOLIDATED_ARCHIVE
git init
git add .
git commit -m "Master consolidated archive v1.0"
```

2. Push to GitHub:
```bash
git remote add origin https://github.com/YOUR_USERNAME/noizylab-master.git
git push -u origin main
```

3. Create GitHub Release with archive

**Pros:** Version control, team collaboration, free storage
**Cons:** Size limitations on GitHub

---

## Verification

### After Upload - Check These:

1. **File Count**
   - Should have: 14+ items across all folders
   - Check: PROJECTS (6), EXTENSIONS (3), DATABASES (1), ORCHESTRATION (1)

2. **File Integrity**
   ```bash
   # Generate checksums before upload
   find /Volumes/4TBSG/MASTER_CONSOLIDATED_ARCHIVE -type f -exec md5sum {} \; > checksums.txt
   
   # Verify after upload
   find ~/Downloads/MASTER_CONSOLIDATED_ARCHIVE -type f -exec md5sum {} \; | diff - checksums.txt
   ```

3. **Critical Files Present**
   - ✅ _MASTER_INDEX.md
   - ✅ CONSOLIDATION_MANIFEST.json
   - ✅ CORE_SYSTEMS/ folder
   - ✅ PROJECTS/ folder
   - ✅ ORCHESTRATION/GORUNFREE/
   - ✅ DATABASES/mission_control_harvest.db

4. **Spot Checks**
   - Open a random project folder
   - Verify file sizes look reasonable
   - Check that nested directories are intact

---

## Team Sharing

### Step 1: Set Permissions

1. Right-click `NOIZYLAB_MASTER` folder in Google Drive
2. Click **Share**
3. Add team members by email
4. Set permissions: **Editor** (can modify) or **Viewer** (read-only)

### Step 2: Create Shared Link

1. Right-click folder → **Share**
2. Change to **Anyone with the link**
3. Copy link and send to team

---

## Backup Strategy

### Primary Backup (Google Drive)
- This deployment
- Automatic sync if using Google Drive for Desktop
- Accessible from any browser
- 5GB estimated size

### Secondary Backup (GitHub)
```bash
# Code-only backup (excludes large files)
git push origin main
```

### Tertiary Backup (Local)
- `/Volumes/4TBSG/MASTER_CONSOLIDATED_ARCHIVE`
- Physical drive backup
- Archive to external HDD quarterly

---

## Troubleshooting

### Upload Stuck or Slow

**Solution:**
- Check internet connection (min 5 Mbps)
- Try uploading smaller folders first
- Use Google Drive for Desktop for better resume support
- Try at off-peak hours

### Files Missing After Upload

**Solution:**
- Verify checksums (see Verification section)
- Check browser developer tools (Ctrl+Shift+J) for errors
- Try uploading again
- Contact Google Drive support if persistent

### Storage Quota Exceeded

**Solution:**
- Delete old Gmail or Google Photos to free space
- Upgrade Google Drive storage plan
- Upload in smaller batches

---

## Post-Deployment

### Update Team

1. Send Google Drive link to team
2. Update project documentation
3. Add link to README.md
4. Create team notification

### Maintenance

- Review quarterly for new files to add
- Update checksums if changes made
- Monitor storage usage
- Keep local copy as backup

---

## Support & Questions

For issues or questions:
1. Check CONSOLIDATION_MANIFEST.json for archive details
2. Review this guide's troubleshooting section
3. Check Google Drive help: https://support.google.com/drive
4. Contact team lead

---

**Status:** ✅ Ready to Deploy
**Last Updated:** November 8, 2025
**Archive Version:** 1.0

# THE AQUARIUM

34TB of creative archives. 40+ years of work.

## Overview

THE_AQUARIUM preserves Rob Plowman's complete creative legacy:
- Music compositions
- Sound design projects
- Film/TV scores
- Production sessions
- Sample libraries
- Project archives

## Storage Distribution

```
Total: ~34TB across distributed storage

GOD (Mac Studio)
├── Active projects
├── Recent archives
└── Hot storage

External Arrays
├── Time Machine backups
├── Cold storage archives
└── Redundant copies

Cloud (Future)
├── R2 for critical files
└── Glacier for deep archive
```

## Notable Works

| Project | Year | Notes |
|---------|------|-------|
| Ed Edd n Eddy | 1999-2009 | Cartoon Network |
| Dragon Tales | 1999-2005 | PBS |
| Johnny Test | 2005-2014 | Warner Bros |
| Transformers | Various | Multiple series |
| Barbie Films | Various | Mattel |
| Q107 Homegrown | ~1990 | Contest winner |

## Cataloging

The `aquarium-archive` D1 database tracks:

```sql
CREATE TABLE archive_items (
    id INTEGER PRIMARY KEY,
    item_id TEXT UNIQUE,
    title TEXT NOT NULL,
    project TEXT,
    year INTEGER,
    category TEXT,
    format TEXT,
    size_bytes INTEGER,
    location TEXT,
    checksum TEXT,
    metadata JSON,
    created_at DATETIME,
    last_verified DATETIME
);
```

## Preservation Strategy

1. **3-2-1 Rule**: 3 copies, 2 media types, 1 offsite
2. **Checksum verification**: Monthly integrity checks
3. **Format migration**: Convert aging formats
4. **Metadata enrichment**: Tag everything

## Access Tiers

| Tier | Storage | Access Time |
|------|---------|-------------|
| Hot | SSD | Instant |
| Warm | HDD | Seconds |
| Cold | Archive | Minutes |
| Glacier | Cloud | Hours |

## Search

```bash
# Find by project
gorunfree aquarium search "Ed Edd"

# Find by year range
gorunfree aquarium search --year 2005-2010

# Find by format
gorunfree aquarium search --format "Pro Tools"
```

---

*40 years of music. One archive. Forever preserved.*

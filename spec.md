# AVK School Memories 2025-2026

## Current State
A school photo gallery app with:
- Public gallery homepage for viewing all uploaded photos
- Admin login at /admin/login with hardcoded credentials (ID: 20695943, password: koushik@070516)
- Admin dashboard for uploading/deleting photos
- Blob storage for photo files
- Session token-based admin authentication

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Admin credentials: change admin ID from "20695943" to "979174859" and password from "koushik@070516" to "koushik@0705"

### Remove
- Nothing

## Implementation Plan
1. Regenerate backend with updated hardcoded admin credentials (adminUserId = "979174859", adminPassword = "koushik@0705")
2. Keep all other backend logic (photo management, session tokens, blob storage) identical

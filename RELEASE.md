# Release Process

## Automated Release via GitHub Actions

The project is configured to automatically build and publish releases to GitHub when you push a version tag.

### Steps to Create a Release

1. **Update the version** in `package.json`:

   ```bash
   npm version patch  # For bug fixes (0.1.0 → 0.1.1)
   npm version minor  # For new features (0.1.0 → 0.2.0)
   npm version major  # For breaking changes (0.1.0 → 1.0.0)
   ```

   This command automatically:

   - Updates `package.json` version
   - Creates a git commit
   - Creates a git tag (e.g., `v0.1.1`)

2. **Push the tag to GitHub**:

   ```bash
   git push origin main
   git push origin --tags
   ```

3. **GitHub Actions will automatically**:

   - Run tests
   - Build the application for Windows, macOS, and Linux
   - Package installers for each platform
   - Create a GitHub Release
   - Upload all artifacts to the release

4. **Monitor the release**:
   - Go to your repository on GitHub
   - Click "Actions" tab to see the workflow progress
   - Once complete, check "Releases" to see your new release with downloadable installers

### Manual Release (Local)

If you need to publish from your local machine:

```bash
# Make sure you have a GH_TOKEN environment variable set
export GH_TOKEN=your_github_personal_access_token  # macOS/Linux
$env:GH_TOKEN="your_github_personal_access_token"  # Windows PowerShell

# Build and publish
npm run release
```

### Release Artifacts

The following files will be created and uploaded:

**Windows:**

- `Quick-API-Client-Desktop-Setup-x.x.x.exe` - NSIS installer
- `Quick API Client Desktop x.x.x.exe` - Portable executable

**macOS:**

- `Quick-API-Client-Desktop-x.x.x.dmg` - DMG installer (universal: x64 + arm64)

**Linux:**

- `Quick-API-Client-Desktop-x.x.x.AppImage` - AppImage (x64)
- `quick-api-client-desktop_x.x.x_amd64.deb` - Debian package

### Configuration

- **electron-builder.json**: Configure build settings, targets, and publish options
- **.github/workflows/release.yml**: Automated release workflow
- **package.json**: Version number and release scripts

### Troubleshooting

**Release fails with "no access":**

- Ensure your repository has "Read and write permissions" for workflows
- Go to Settings → Actions → General → Workflow permissions
- Select "Read and write permissions" and save

**Missing GH_TOKEN:**

- GitHub Actions automatically provides `GITHUB_TOKEN`
- For local releases, create a Personal Access Token with `repo` scope
- Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)

**Build fails on specific platform:**

- Check the Actions logs for that platform
- Some platforms require specific dependencies (e.g., Linux needs certain system libraries)

### Before Your First Release

**Update electron-builder.json:**
Replace `"your-github-username"` with your actual GitHub username:

```json
"publish": {
  "provider": "github",
  "owner": "your-github-username",
  "repo": "APIPO-Simple-API-tester",
  "releaseType": "release"
}
```

**Optional - Create Release Template:**
When creating releases, GitHub can use a template. Create `.github/release-template.md`:

```markdown
## What's Changed

<!-- Describe the changes in this release -->

## Installation

Download the installer for your platform below.

**Full Changelog**: https://github.com/your-username/APIPO-Simple-API-tester/compare/v{previous}...v{current}
```

## Auto-Update Support

The current configuration generates update metadata files (`.yml` and `.blockmap`) that enable auto-update functionality in your Electron app. To implement auto-updates, you'll need to integrate `electron-updater` in your main process.

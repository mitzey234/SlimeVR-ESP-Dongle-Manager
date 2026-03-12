const Firmware = require("./firmware.js");

const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_REPO = 'mitzey234/SlimeVR-Receiver-ESP-Now';
const CACHE_FILENAME = 'firmware_update_cache.json';
const DOWNLOADS_DIRNAME = 'firmware_downloads';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class FirmwareUpdate {
    /**
     * @param {Electron.App} app - The Electron app instance, used to resolve appData paths.
     */
    constructor(app) {
        this.app = app;
        this.dataDir = path.join(app.getPath('userData'), 'firmware');
        this.cacheFile = path.join(this.dataDir, CACHE_FILENAME);
        this.downloadsDir = path.join(this.dataDir, DOWNLOADS_DIRNAME);
        this._ensureDirectories();
    }

    _ensureDirectories() {
        try {
            fs.mkdirSync(this.dataDir, { recursive: true });
            fs.mkdirSync(this.downloadsDir, { recursive: true });
        } catch (error) {
            console.error('[FirmwareUpdate] Failed to create storage directories:', error);
        }
    }

    _readCache() {
        try {
            if (fs.existsSync(this.cacheFile)) {
                const raw = fs.readFileSync(this.cacheFile, 'utf-8');
                return JSON.parse(raw);
            }
        } catch (error) {
            console.error('[FirmwareUpdate] Failed to read cache file:', error);
        }
        return null;
    }

    _writeCache(data) {
        try {
            fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2), 'utf-8');
        } catch (error) {
            console.error('[FirmwareUpdate] Failed to write cache file:', error);
        }
    }

    _isCacheValid(cache) {
        if (!cache || !cache.lastChecked) return false;
        return (Date.now() - cache.lastChecked) < CACHE_TTL_MS;
    }

    /**
     * Perform an HTTPS GET and resolve with the parsed JSON body.
     * @param {string} url
     * @returns {Promise<object>}
     */
    _fetchJSON(url) {
        return new Promise((resolve, reject) => {
            const options = {
                headers: {
                    'User-Agent': 'SlimeVR-ESP-Dongle-Manager',
                    'Accept': 'application/vnd.github+json',
                },
            };

            https.get(url, options, (res) => {
                // Follow redirects (GitHub API uses 301/302 occasionally)
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return this._fetchJSON(res.headers.location).then(resolve).catch(reject);
                }

                if (res.statusCode !== 200) {
                    res.resume();
                    return reject(new Error(`GitHub API returned status ${res.statusCode} for ${url}`));
                }

                let body = '';
                res.setEncoding('utf-8');
                res.on('data', (chunk) => (body += chunk));
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body));
                    } catch (err) {
                        reject(new Error(`Failed to parse JSON response: ${err.message}`));
                    }
                });
                res.on('error', reject);
            }).on('error', reject);
        });
    }

    /**
     * Validate a downloaded zip by parsing it as a Firmware.
     * If parse() returns a number (error code) the file is deleted.
     * @param {string} filePath - Absolute path to the zip file.
     * @returns {Promise<Firmware|null>} The populated Firmware instance, or null on failure.
     */
    async _validateZip(filePath) {
        const firmware = new Firmware(filePath);
        let parseResult;
        try {
            parseResult = await firmware.parse();
        } catch (error) {
            console.error(`[FirmwareUpdate] Exception while validating ${path.basename(filePath)}:`, error);
            try { fs.unlinkSync(filePath); } catch (e) { console.error('[FirmwareUpdate] Failed to delete invalid zip:', e); }
            return null;
        }

        if (typeof parseResult === 'number') {
            console.error(`[FirmwareUpdate] Firmware validation failed for ${path.basename(filePath)} (error code ${parseResult}), deleting.`);
            try { fs.unlinkSync(filePath); } catch (e) { console.error('[FirmwareUpdate] Failed to delete invalid zip:', e); }
            return null;
        }

        return firmware;
    }

    /**
     * Download a single GitHub release asset and record the outcome in result.
     * @param {{name: string, browser_download_url: string}} asset
     * @param {string} destPath
     * @param {{downloaded: string[], errors: string[]}} result
     * @returns {Promise<boolean>} true on success
     */
    async _downloadAsset(asset, destPath, result) {
        console.log(`[FirmwareUpdate] Downloading ${asset.name}`);
        try {
            await this._downloadFile(asset.browser_download_url, destPath);
            if (!result.downloaded.includes(destPath)) result.downloaded.push(destPath);
            return true;
        } catch (error) {
            const msg = `Failed to download ${asset.name}: ${error.message}`;
            console.error('[FirmwareUpdate]', msg);
            result.errors.push(msg);
            return false;
        }
    }

    /**
     * Download a file from `url` to `destPath`, following redirects.
     * @param {string} url
     * @param {string} destPath
     * @returns {Promise<void>}
     */
    _downloadFile(url, destPath) {
        return new Promise((resolve, reject) => {
            const options = {
                headers: { 'User-Agent': 'SlimeVR-ESP-Dongle-Manager' },
            };

            https.get(url, options, (res) => {
                // Follow redirects (GitHub asset downloads always redirect)
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return this._downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
                }

                if (res.statusCode !== 200) {
                    res.resume();
                    return reject(new Error(`Download failed with status ${res.statusCode} for ${url}`));
                }

                const fileStream = fs.createWriteStream(destPath);
                res.pipe(fileStream);
                fileStream.on('finish', () => fileStream.close(resolve));
                fileStream.on('error', (err) => {
                    fs.unlink(destPath, () => {}); // clean up partial file
                    reject(err);
                });
                res.on('error', (err) => {
                    fs.unlink(destPath, () => {});
                    reject(err);
                });
            }).on('error', reject);
        });
    }

    /**
     * Check for the latest release and download any zip assets if not already
     * present.  Respects a 5-minute cache so GitHub is not hammered.
     *
     * @param {object} [options]
     * @param {boolean} [options.force=false] - Skip the cache TTL check.
     * @returns {Promise<{
     *   skipped: boolean,
     *   tag: string|null,
     *   alreadyDownloaded: boolean,
     *   downloaded: string[],
     *   errors: string[]
     * }>}
     */
    async checkForUpdates({ force = false } = {}) {
        const result = {
            skipped: false,
            tag: null,
            alreadyDownloaded: false,
            downloaded: [],
            errors: [],
        };

        // --- Cache TTL guard ---
        const cache = this._readCache();
        if (!force && this._isCacheValid(cache)) {
            console.log('[FirmwareUpdate] Skipping update check');
            result.skipped = true;
            result.tag = cache.latestTag ?? null;
            result.alreadyDownloaded = cache.alreadyDownloaded ?? false;
            return result;
        }

        // --- Fetch latest release from GitHub ---
        let release;
        try {
            release = await this._fetchJSON(
                `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
            );
        } catch (error) {
            const msg = `Failed to fetch latest release: ${error.message}`;
            console.error('[FirmwareUpdate]', msg);
            result.errors.push(msg);
            return result;
        }

        const tag = release.tag_name;
        result.tag = tag;

        // --- Persist the check timestamp regardless of download outcome ---
        const newCache = {
            lastChecked: Date.now(),
            latestTag: tag,
            alreadyDownloaded: false,
        };

        // --- Determine the release download directory ---
        const releaseDir = path.join(this.downloadsDir, tag);

        // --- Filter assets: only .zip files ---
        const zipAssets = (release.assets || []).filter(
            (asset) => asset.name.toLowerCase().endsWith('.zip')
        );

        if (zipAssets.length === 0) {
            console.log(`[FirmwareUpdate] Release ${tag} has no zip assets.`);
            newCache.alreadyDownloaded = true;
            result.alreadyDownloaded = true;
            this._writeCache(newCache);
            return result;
        }

        // --- Ensure the per-release directory exists ---
        try {
            fs.mkdirSync(releaseDir, { recursive: true });
        } catch (error) {
            const msg = `Failed to create release directory: ${error.message}`;
            console.error('[FirmwareUpdate]', msg);
            result.errors.push(msg);
            this._writeCache(newCache);
            return result;
        }

        // --- Pass 1: download any missing zips ---
        for (const asset of zipAssets) {
            const destPath = path.join(releaseDir, asset.name);
            if (!fs.existsSync(destPath)) {
                await this._downloadAsset(asset, destPath, result);
            }
        }

        // --- Validate all present zips; _validateZip deletes failures ---
        const failedAssets = [];
        for (const asset of zipAssets) {
            const destPath = path.join(releaseDir, asset.name);
            if (!fs.existsSync(destPath)) {
                // Never downloaded or download failed — mark for retry
                failedAssets.push(asset);
                continue;
            }
            const firmware = await this._validateZip(destPath);
            if (firmware === null) {
                // File was deleted by _validateZip
                failedAssets.push(asset);
            }
        }

        // --- Pass 2: re-download and re-validate anything that failed ---
        if (failedAssets.length > 0) {
            console.log(`[FirmwareUpdate] Re-downloading ${failedAssets.length} asset(s) that failed validation.`);
            for (const asset of failedAssets) {
                const destPath = path.join(releaseDir, asset.name);
                const ok = await this._downloadAsset(asset, destPath, result);
                if (ok) {
                    const firmware = await this._validateZip(destPath);
                    if (firmware === null) {
                        const msg = `${asset.name} failed validation after re-download and was deleted.`;
                        console.error('[FirmwareUpdate]', msg);
                        result.errors.push(msg);
                    }
                }
            }
        }

        // --- Final: mark complete only if every zip is present and valid ---
        const allValid = zipAssets.every((asset) =>
            fs.existsSync(path.join(releaseDir, asset.name))
        );
        newCache.alreadyDownloaded = allValid;
        result.alreadyDownloaded = allValid;
        this._writeCache(newCache);
        return result;
    }

    /**
     * Return the path to the downloads directory for a specific release tag,
     * or the root downloads directory if no tag is provided.
     * @param {string} [tag]
     * @returns {string}
     */
    getDownloadsPath(tag) {
        return tag ? path.join(this.downloadsDir, tag) : this.downloadsDir;
    }

    /**
     * Invalidate the local cache so the next call to checkForUpdates() always
     * hits GitHub, regardless of when the last check occurred.
     */
    invalidateCache() {
        try {
            if (fs.existsSync(this.cacheFile)) {
                fs.unlinkSync(this.cacheFile);
            }
        } catch (error) {
            console.error('[FirmwareUpdate] Failed to invalidate cache:', error);
        }
    }

    getLatestTag() {
        const cache = this._readCache();
        return cache?.latestTag ?? null;
    }

    getAvailableReleases() {
        if (!fs.existsSync(this.downloadsDir)) {
            console.warn(`[FirmwareUpdate] Downloads directory does not exist: ${this.downloadsDir}`);
            return [];
        }
        return fs.readdirSync(this.downloadsDir).filter((entry) => {
            const fullPath = path.join(this.downloadsDir, entry);
            return fs.statSync(fullPath).isDirectory();
        });
    }

    getAvailableFiles(tag) {
        const releaseDir = this.getDownloadsPath(tag);
        if (!fs.existsSync(releaseDir)) {
            console.warn(`[FirmwareUpdate] Release directory does not exist: ${releaseDir}`);
            return [];
        }
        return fs.readdirSync(releaseDir).filter((file) => file.toLowerCase().endsWith('.zip')).map((file) => file.replace(/\.zip$/i, ''));
    }

    async getFirmwareArchive(tag, board) {
        const releaseDir = this.getDownloadsPath(tag);
        const fileName = `${board}.zip`;
        const filePath = path.join(releaseDir, fileName);
        if (!fs.existsSync(filePath)) {
            console.warn(`[FirmwareUpdate] Requested firmware archive does not exist: ${filePath}`);
            return -10;
        }
        let firmware;
        try {
            firmware = new Firmware(filePath);
        } catch (error) {
            console.error(`[FirmwareUpdate] Failed to create Firmware instance for ${filePath}:`, error);
            return -20;
        }
        let result = await firmware.parse();
        if (typeof result === 'number') {
            console.error(`[FirmwareUpdate] Firmware archive ${filePath} failed to parse with error code ${result}`);
            return result;
        }
        return firmware;
    }
}

module.exports = FirmwareUpdate;
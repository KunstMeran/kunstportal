/**
 * STORAGE SERVICE
 * Verwaltung von Datei-Uploads zum Hetzner Server
 * Projektsoftware Kunst Meran v3.0
 */

const StorageService = {
    /**
     * Upload einer Datei (z.B. Rechnung)
     */
    async uploadFile(file, folder = 'invoices', customFilename = null) {
        try {
            console.log('📤 Uploading file:', file.name);

            const result = await ApiClient.uploadFile(folder, file, customFilename);

            console.log('✅ File uploaded:', result.path);
            return {
                path: result.path,
                fullPath: result.path,
                url: this.getFileUrl(result.path)
            };

        } catch (error) {
            console.error('❌ Upload-Fehler:', error);
            throw error;
        }
    },

    /**
     * URL für eine Datei generieren
     */
    getFileUrl(filePath) {
        return `${Config.storage.baseUrl}/${filePath}`;
    },

    /**
     * Public URL (alias für Kompatibilität)
     */
    getPublicUrl(filePath) {
        return this.getFileUrl(filePath);
    },

    /**
     * Datei löschen
     */
    async deleteFile(filePath) {
        try {
            const parts = filePath.split('/');
            const filename = parts.pop();
            const folder = parts.join('/') || 'invoices';

            await ApiClient.deleteFile(folder, filename);
            console.log('🗑️ File deleted:', filePath);
            return true;

        } catch (error) {
            console.error('❌ Fehler beim Löschen:', error);
            throw error;
        }
    },

    /**
     * Alle Dateien eines Ordners auflisten
     */
    async listFiles(folder = 'invoices') {
        try {
            const files = await ApiClient.listFiles(folder);
            return files || [];

        } catch (error) {
            console.error('❌ Fehler beim Auflisten:', error);
            return [];
        }
    },

    /**
     * Alias für Kompatibilität
     */
    async listProjectFiles(projectId) {
        return this.listFiles(`invoices/${projectId}`);
    },

    /**
     * Datei herunterladen
     */
    async downloadFile(filePath) {
        try {
            const url = this.getFileUrl(filePath);
            const response = await fetch(url, { credentials: 'include' });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filePath.split('/').pop();
            a.click();
            URL.revokeObjectURL(downloadUrl);

        } catch (error) {
            console.error('❌ Download-Fehler:', error);
            throw error;
        }
    },

    /**
     * PDF in neuem Tab öffnen
     */
    openFile(filePath) {
        const url = this.getFileUrl(filePath);
        window.open(url, '_blank');
    }
};

console.log('📦 Storage Service geladen (Hetzner)');

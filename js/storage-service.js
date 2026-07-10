/**
 * STORAGE SERVICE
 * Verwaltung von Datei-Uploads zu Supabase Storage
 * Projektsoftware Kunst Meran
 */

const StorageService = {
    bucketName: 'invoices',

    /**
     * Upload einer Datei (z.B. Rechnung)
     */
    async uploadFile(file, projectId, costId = null) {
        try {
            // Dateiname generieren: projektId/costId_originalname.pdf
            const timestamp = Date.now();
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = costId
                ? `${projectId}/${costId}_${timestamp}_${sanitizedName}`
                : `${projectId}/${timestamp}_${sanitizedName}`;

            console.log('📤 Uploading file:', fileName);

            const { data, error } = await SupabaseService.client.storage
                .from(this.bucketName)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            console.log('✅ File uploaded:', data.path);
            return {
                path: data.path,
                fullPath: data.fullPath || data.path,
                url: this.getPublicUrl(data.path)
            };

        } catch (error) {
            console.error('❌ Upload-Fehler:', error);
            throw error;
        }
    },

    /**
     * Download-URL für eine Datei generieren
     */
    getPublicUrl(filePath) {
        const { data } = SupabaseService.client.storage
            .from(this.bucketName)
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    /**
     * Signierte URL für privaten Download (24h gültig)
     */
    async getSignedUrl(filePath) {
        try {
            const { data, error } = await SupabaseService.client.storage
                .from(this.bucketName)
                .createSignedUrl(filePath, 86400); // 24 Stunden

            if (error) throw error;
            return data.signedUrl;

        } catch (error) {
            console.error('❌ Fehler beim Generieren der URL:', error);
            throw error;
        }
    },

    /**
     * Datei löschen
     */
    async deleteFile(filePath) {
        try {
            const { error } = await SupabaseService.client.storage
                .from(this.bucketName)
                .remove([filePath]);

            if (error) throw error;
            console.log('🗑️ File deleted:', filePath);
            return true;

        } catch (error) {
            console.error('❌ Fehler beim Löschen:', error);
            throw error;
        }
    },

    /**
     * Alle Dateien eines Projekts auflisten
     */
    async listProjectFiles(projectId) {
        try {
            const { data, error } = await SupabaseService.client.storage
                .from(this.bucketName)
                .list(projectId, {
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (error) throw error;
            return data || [];

        } catch (error) {
            console.error('❌ Fehler beim Auflisten:', error);
            return [];
        }
    },

    /**
     * Datei herunterladen
     */
    async downloadFile(filePath) {
        try {
            const { data, error } = await SupabaseService.client.storage
                .from(this.bucketName)
                .download(filePath);

            if (error) throw error;

            // Blob URL erstellen für Download
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = filePath.split('/').pop();
            a.click();
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('❌ Download-Fehler:', error);
            throw error;
        }
    }
};

console.log('📦 Storage Service geladen');

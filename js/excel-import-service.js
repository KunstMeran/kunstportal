/**
 * EXCEL IMPORT SERVICE
 * Import von DATEV-Buchungen und Lieferanten aus Excel-Exporten
 * Projektsoftware Kunst Meran
 */

const ExcelImportService = {

    /**
     * Parse Excel-Datei für DATEV-Buchungen
     * Jahr wird automatisch aus dem Datum jeder Buchung erkannt
     * @param {File} file - Excel-Datei
     * @param {number} year - Optional: Wird ignoriert, Jahr kommt aus Datum
     */
    async importDatevBookings(file, year = null) {
        try {
            console.log('📤 Importiere DATEV-Buchungen (Jahr wird aus Datum erkannt)');

            // Excel-Datei parsen mit SheetJS
            const data = await this.parseExcelFile(file);
            if (!data || data.length === 0) {
                throw new Error('Keine Daten in Excel-Datei gefunden');
            }

            console.log(`📊 ${data.length} Zeilen gefunden`);

            // Lieferanten-Liste laden für Partita IVA Lookup
            const { data: suppliers, error: supplierError } = await SupabaseService.client
                .from('suppliers')
                .select('fornitore_name, partita_iva, fornitore_nr');

            if (supplierError) {
                console.warn('⚠️ Konnte Lieferanten nicht laden:', supplierError);
            }

            const supplierMap = new Map();
            if (suppliers) {
                suppliers.forEach(s => {
                    // Map by name (case-insensitive)
                    const key = s.fornitore_name.toLowerCase().trim();
                    supplierMap.set(key, {
                        partita_iva: s.partita_iva,
                        fornitore_nr: s.fornitore_nr
                    });
                });
            }
            console.log(`📇 ${supplierMap.size} Lieferanten für Matching geladen`);

            // 1. Prüfe, welche Buchungen bereits existieren (alle Jahre, da Jahr aus Datum kommt)
            // Erweiterter Key: partita_iva + dokument_nr + datum + betrag + konto_nr + fornitore_name + beschreibung
            // Dies ermöglicht auch den Import von Buchungen ohne Dokument-Nr. (z.B. Mitgliedsbeiträge)
            const { data: existingBookings, error: fetchError } = await SupabaseService.client
                .from('datev_bookings')
                .select('partita_iva, dokument_nr, datum, betrag, konto_nr, fornitore_name, beschreibung');

            if (fetchError) throw fetchError;

            const existingKeys = new Set(
                existingBookings.map(b =>
                    `${b.partita_iva || ''}_${b.dokument_nr || ''}_${b.datum}_${b.betrag}_${b.konto_nr || ''}_${(b.fornitore_name || '').substring(0, 30)}_${(b.beschreibung || '').substring(0, 30)}`
                )
            );

            console.log(`✅ ${existingBookings.length} Buchungen bereits in Datenbank`);

            // 2. Filter neue Buchungen (Jahr wird aus Datum erkannt)
            const newBookings = data
                .map(row => this.mapRowToDatevBooking(row, null, file.name, supplierMap))
                .filter(booking => {
                    // Überspringe Zeilen ohne Datum (NOT NULL Constraint)
                    if (!booking.datum) {
                        console.warn('⚠️ Zeile übersprungen: Kein Datum', booking);
                        return false;
                    }

                    const key = `${booking.partita_iva || ''}_${booking.dokument_nr || ''}_${booking.datum}_${booking.betrag}_${booking.konto_nr || ''}_${(booking.fornitore_name || '').substring(0, 30)}_${(booking.beschreibung || '').substring(0, 30)}`;
                    return !existingKeys.has(key);
                });

            console.log(`🆕 ${newBookings.length} neue Buchungen zum Import`);

            if (newBookings.length === 0) {
                return {
                    success: true,
                    imported: 0,
                    skipped: data.length,
                    message: 'Alle Buchungen bereits vorhanden'
                };
            }

            // 3. Duplikate innerhalb der Batch entfernen
            const uniqueNewBookings = [];
            const seenInBatch = new Set();
            for (const booking of newBookings) {
                const key = `${booking.partita_iva || ''}_${booking.dokument_nr || ''}_${booking.datum}_${booking.betrag}_${booking.konto_nr || ''}_${(booking.fornitore_name || '').substring(0, 30)}_${(booking.beschreibung || '').substring(0, 30)}`;
                if (!seenInBatch.has(key)) {
                    seenInBatch.add(key);
                    uniqueNewBookings.push(booking);
                }
            }

            const batchDuplicates = newBookings.length - uniqueNewBookings.length;
            if (batchDuplicates > 0) {
                console.log(`🔄 ${batchDuplicates} Duplikate innerhalb der Datei entfernt`);
            }

            // 4. Import in Supabase - einzeln um Duplikat-Fehler abzufangen
            let successCount = 0;
            let duplicateDbCount = 0;
            const errors = [];

            // Batch-Import in Chunks von 50 für bessere Performance
            const chunkSize = 50;
            for (let i = 0; i < uniqueNewBookings.length; i += chunkSize) {
                const chunk = uniqueNewBookings.slice(i, i + chunkSize);

                const { data: insertedChunk, error: insertError } = await SupabaseService.client
                    .from('datev_bookings')
                    .insert(chunk)
                    .select();

                if (insertError) {
                    // Bei Duplikat-Fehler: Einzeln importieren
                    if (insertError.code === '23505') { // unique_violation
                        console.log(`⚠️ Duplikat in Chunk ${i}-${i+chunkSize}, importiere einzeln...`);
                        for (const booking of chunk) {
                            const { data: singleInsert, error: singleError } = await SupabaseService.client
                                .from('datev_bookings')
                                .insert(booking)
                                .select();

                            if (singleError) {
                                if (singleError.code === '23505') {
                                    duplicateDbCount++;
                                } else {
                                    errors.push(singleError.message);
                                }
                            } else if (singleInsert) {
                                successCount += singleInsert.length;
                            }
                        }
                    } else {
                        errors.push(insertError.message);
                    }
                } else if (insertedChunk) {
                    successCount += insertedChunk.length;
                }
            }

            console.log(`✅ ${successCount} Buchungen erfolgreich importiert`);
            if (duplicateDbCount > 0) {
                console.log(`🔄 ${duplicateDbCount} Duplikate in Datenbank gefunden`);
            }

            const totalSkipped = (data.length - newBookings.length) + batchDuplicates + duplicateDbCount;
            return {
                success: errors.length === 0,
                imported: successCount,
                skipped: totalSkipped,
                batchDuplicates: batchDuplicates,
                dbDuplicates: duplicateDbCount,
                errors: errors.length > 0 ? errors : undefined,
                message: `${successCount} neue Buchungen importiert, ${totalSkipped} übersprungen`
            };

        } catch (error) {
            console.error('❌ Import-Fehler:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Parse Excel-Datei für Lieferanten
     */
    async importSuppliers(file) {
        try {
            console.log('📤 Importiere Lieferanten');

            const data = await this.parseExcelFile(file);
            if (!data || data.length === 0) {
                throw new Error('Keine Daten in Excel-Datei gefunden');
            }

            console.log(`📊 ${data.length} Lieferanten gefunden`);

            // Map zu Supplier-Objekten
            const suppliers = data
                .map(row => this.mapRowToSupplier(row, file.name))
                .filter(s => s.partita_iva); // Nur mit Partita IVA

            console.log(`✅ ${suppliers.length} gültige Lieferanten`);

            if (suppliers.length === 0) {
                throw new Error('Keine gültigen Lieferanten gefunden (Partita IVA fehlt)');
            }

            // Duplikate in der Excel-Datei entfernen (nur erste Zeile pro partita_iva behalten)
            const uniqueSuppliers = [];
            const seenPartitaIva = new Set();
            for (const supplier of suppliers) {
                if (!seenPartitaIva.has(supplier.partita_iva)) {
                    seenPartitaIva.add(supplier.partita_iva);
                    uniqueSuppliers.push(supplier);
                }
            }

            console.log(`🔄 ${suppliers.length - uniqueSuppliers.length} Duplikate in Datei entfernt`);

            // Upsert (INSERT or UPDATE on conflict) - ignoreDuplicates: true für bereits existierende
            const { data: upsertedData, error: upsertError } = await SupabaseService.client
                .from('suppliers')
                .upsert(uniqueSuppliers, {
                    onConflict: 'partita_iva',
                    ignoreDuplicates: true
                })
                .select();

            if (upsertError) throw upsertError;

            console.log(`✅ ${upsertedData.length} Lieferanten importiert/aktualisiert`);

            // DATEV-Buchungen mit Lieferantennamen aktualisieren
            let updatedBookings = 0;
            for (const supplier of uniqueSuppliers) {
                const { data: updated, error: updateError } = await SupabaseService.client
                    .from('datev_bookings')
                    .update({ fornitore_name: supplier.fornitore_name })
                    .eq('partita_iva', supplier.partita_iva)
                    .select('id');

                if (!updateError && updated) {
                    updatedBookings += updated.length;
                }
            }
            console.log(`🔄 ${updatedBookings} DATEV-Buchungen aktualisiert`);

            return {
                success: true,
                imported: upsertedData.length,
                updatedBookings: updatedBookings,
                message: `${upsertedData.length} Lieferanten importiert, ${updatedBookings} Buchungen aktualisiert`
            };

        } catch (error) {
            console.error('❌ Import-Fehler:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Excel-Datei parsen mit SheetJS
     */
    async parseExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Erstes Sheet verwenden
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { raw: false });

                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Excel-Zeile zu DATEV-Buchung mappen
     * Mapping für DATEV-Export Spalten
     */
    mapRowToDatevBooking(row, year, fileName, supplierMap) {
        // Lieferantenname ermitteln:
        // 1. Aus Denominazione (Firmenname)
        // 2. Aus Descrizione movimento extrahieren (z.B. "Agnelli Mario - Honorarnote vom 29.04.2026")
        // 3. Fallback: Descrizione conto (Kontoname wie "Costi altri servizi")
        let fornitoreName = row['Denominazione'] || '';

        // Falls kein Denominazione, versuche aus Descrizione movimento zu extrahieren
        if (!fornitoreName && row['Descrizione movimento']) {
            const descrizione = row['Descrizione movimento'].trim();
            // Format: "Name - Beschreibung" oder "Name vom Datum"
            const separators = [' - ', ' vom '];
            for (const sep of separators) {
                if (descrizione.includes(sep)) {
                    fornitoreName = descrizione.split(sep)[0].trim();
                    break;
                }
            }
        }

        // Fallback auf Kontoname
        if (!fornitoreName) {
            fornitoreName = row['Descrizione conto'] || 'Unbekannt';
        }

        // Lookup Partita IVA und Fornitore Nr aus Lieferanten-Tabelle
        let partitaIva = null;
        let fornitoreNr = null;

        if (supplierMap && fornitoreName !== 'Unbekannt') {
            const key = fornitoreName.toLowerCase().trim();
            const supplier = supplierMap.get(key);
            if (supplier) {
                partitaIva = supplier.partita_iva;
                fornitoreNr = supplier.fornitore_nr;
                console.log(`✅ Matched: "${fornitoreName}" → ${partitaIva}`);
            }
        }

        // Datum parsen und Jahr extrahieren
        const datum = this.parseDate(row['Data documento']) || this.parseDate(row['Data registrazione']);
        const importYear = datum ? new Date(datum).getFullYear() : new Date().getFullYear();

        return {
            import_year: importYear, // Jahr aus Datum automatisch erkannt
            import_file_name: fileName,

            // DATEV-Spalten-Mapping
            partita_iva: partitaIva, // Aus Lieferanten-Tabelle via Name
            partita_iva_cliente: null,
            konto_nr: row['Conto'] || null, // Buchhaltungs-Kontonummer
            fornitore_nr: fornitoreNr, // Lieferanten-Nummer aus suppliers Tabelle
            fornitore_name: fornitoreName,
            dokument_nr: row['Numero documento'] || '',
            dokument_typ: 'F', // Standard: Fattura

            // Gutschrift erkennen (negatives Importo)
            ist_gutschrift: this.parseDecimal(row['Importo']) < 0,

            // Beträge
            betrag: Math.abs(this.parseDecimal(row['Importo'])),
            betrag_netto: Math.abs(this.parseDecimal(row['Importo'])), // Vereinfachung
            betrag_mwst: null, // Nicht im Export enthalten
            betrag_gesamt: Math.abs(this.parseDecimal(row['Importo'])),
            mwst_typ: null,

            // Daten
            datum: datum,
            projekt_id: row['Centro di costo'] || null,
            beschreibung: row['Descrizione movimento'] || null,
            kategorie: row['Descrizione conto'] || null
        };
    },

    /**
     * Excel-Zeile zu Lieferant mappen
     * Unterstützt verschiedene Spaltenformate:
     * - Format 1: Codice Cli, Nominativo, Indirizzo, CodiceFisc, Partita IVA
     * - Format 2: Numero, Nome/Denominazione, Via, Località, Partita IVA, Codice fiscale
     */
    mapRowToSupplier(row, fileName) {
        // Partita IVA aus verschiedenen möglichen Spalten
        let partitaIva = row['Partita IVA'] || row['CodiceFisc'] || row['P.IVA'] || null;

        // Als String konvertieren falls Zahl (Excel wissenschaftliche Notation)
        if (partitaIva && typeof partitaIva === 'number') {
            partitaIva = String(Math.round(partitaIva));
        }
        if (partitaIva) {
            partitaIva = String(partitaIva).trim();
        }

        // IT-Prefix hinzufügen wenn nicht vorhanden
        if (partitaIva && !partitaIva.startsWith('IT') && !partitaIva.startsWith('DE') && !partitaIva.startsWith('AT') && !partitaIva.startsWith('CF:')) {
            partitaIva = 'IT' + partitaIva;
        }

        // Für ausländische Lieferanten: Partita IVA Estera + IDISO
        const partitaIvaEstera = row['Partita IVA estera'];
        const idIso = row['IDISO'];
        if (partitaIvaEstera && idIso) {
            partitaIva = idIso + partitaIvaEstera;
        }

        // Codice Fiscale (für Künstler ohne Partita IVA)
        const codiceFiscale = row['Codice fiscale'] || row['CodiceFisc'] || row['C.F.'] || null;

        // Falls keine Partita IVA, aber Codice Fiscale vorhanden
        if (!partitaIva && codiceFiscale) {
            partitaIva = 'CF:' + codiceFiscale; // CF: Prefix für Codice Fiscale
        }

        return {
            partita_iva: partitaIva,
            fornitore_nr: row['Numero'] || row['Codice Cli'] || row['DATEV-ID'] || row['Conto'] || null,
            fornitore_name: row['Nominativo'] || row['Nome'] || row['Denominazione'] || 'Unbekannt',
            codice_fiscale: codiceFiscale || null,
            address: row['Indirizzo'] || row['Via'] || null,
            city: row['Località'] || row['Citta'] || null,
            country: idIso || row['Paese'] || 'IT',
            email: row['Email'] || null,
            phone: row['Telefono'] || null,
            import_file_name: fileName
        };
    },

    /**
     * Helper: Decimal parsen (europäisches Format: 1.234,56)
     */
    parseDecimal(value) {
        if (value === null || value === undefined || value === '') return null;

        // Wenn bereits eine Zahl, direkt zurückgeben
        if (typeof value === 'number') return value;

        let str = String(value).trim();

        // Prüfe ob europäisches Format (Komma als Dezimaltrennzeichen)
        // Europäisch: 1.234,56 oder 1234,56
        // US/UK: 1,234.56 oder 1234.56

        const hasComma = str.includes(',');
        const hasDot = str.includes('.');

        if (hasComma && hasDot) {
            // Beide vorhanden - prüfe welches zuletzt kommt
            const lastComma = str.lastIndexOf(',');
            const lastDot = str.lastIndexOf('.');

            if (lastComma > lastDot) {
                // Europäisch: 1.234,56 - Komma ist Dezimaltrennzeichen
                str = str.replace(/\./g, '').replace(',', '.');
            } else {
                // US: 1,234.56 - Punkt ist Dezimaltrennzeichen
                str = str.replace(/,/g, '');
            }
        } else if (hasComma && !hasDot) {
            // Nur Komma: 1234,56 - europäisches Dezimaltrennzeichen
            str = str.replace(',', '.');
        }
        // Wenn nur Punkt, ist es bereits im richtigen Format

        const parsed = parseFloat(str);
        return isNaN(parsed) ? null : parsed;
    },

    /**
     * Helper: Boolean parsen
     */
    parseBoolean(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            const lower = value.toLowerCase().trim();
            return lower === 'true' || lower === 'ja' || lower === 'yes' || lower === '1';
        }
        return Boolean(value);
    },

    /**
     * Helper: Datum parsen
     */
    parseDate(value) {
        if (!value) return null;

        // ISO-Format: 2026-06-04
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
        }

        // DD.MM.YYYY oder DD/MM/YYYY
        if (/^\d{1,2}[./]\d{1,2}[./]\d{4}$/.test(value)) {
            const parts = value.split(/[./]/);
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }

        // Excel Datum (serielle Nummer seit 1900-01-01)
        if (typeof value === 'number' && value > 0) {
            const excelEpoch = new Date(1900, 0, 1);
            const days = value - 2; // Excel hat einen Off-by-2 Fehler
            const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // Fallback: Date-Objekt erstellen
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            console.warn('⚠️ Datum konnte nicht geparst werden:', value);
            return null;
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Alle Jahre mit DATEV-Buchungen abrufen (für Jahres-Auswahl)
     */
    async getAvailableYears() {
        try {
            const { data, error } = await SupabaseService.client
                .from('datev_bookings')
                .select('import_year')
                .order('import_year', { ascending: false });

            if (error) throw error;

            const years = [...new Set(data.map(b => b.import_year))];
            return years;

        } catch (error) {
            console.error('❌ Fehler beim Laden der Jahre:', error);
            return [];
        }
    }
};

console.log('📊 Excel Import Service geladen');

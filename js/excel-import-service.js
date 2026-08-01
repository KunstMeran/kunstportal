/**
 * EXCEL IMPORT SERVICE
 * Import von DATEV-Buchungen und Lieferanten aus Excel-Exporten
 * Projektsoftware Kunst Meran
 */

const ExcelImportService = {

    /**
     * Generiert einen eindeutigen Key für eine Buchung
     * Key basiert auf: konto_nr + datum + betrag + beschreibung (erste 50 Zeichen)
     */
    generateBookingKey(booking) {
        return `${booking.konto_nr || ''}_${booking.datum}_${booking.betrag}_${(booking.beschreibung || '').substring(0, 50)}`;
    },

    async importDatevBookings(file, year = null) {
        try {
            console.log('📤 Importiere DATEV-Buchungen (Count-basiertes Matching)');

            // Excel-Datei parsen mit SheetJS
            const data = await this.parseExcelFile(file);
            if (!data || data.length === 0) {
                throw new Error('Keine Daten in Excel-Datei gefunden');
            }

            console.log(`📊 ${data.length} Zeilen in Excel gefunden`);

            // Tracking für übersprungene Zeilen
            const skippedRows = [];

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
                    const key = s.fornitore_name.toLowerCase().trim();
                    supplierMap.set(key, {
                        partita_iva: s.partita_iva,
                        fornitore_nr: s.fornitore_nr
                    });
                });
            }
            console.log(`📇 ${supplierMap.size} Lieferanten für Matching geladen`);

            // 1. Alle Excel-Zeilen zu Buchungen mappen
            const excelBookings = [];
            for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
                const row = data[rowIndex];
                const booking = this.mapRowToDatevBooking(row, null, file.name, supplierMap);
                booking._rowIndex = rowIndex + 2; // Excel-Zeile für Reporting

                if (!booking.datum) {
                    skippedRows.push({
                        rowNumber: rowIndex + 2,
                        reason: 'Kein gültiges Datum',
                        reasonCode: 'NO_DATE',
                        data: {
                            konto: row['Conto'] || '',
                            fornitore: row['Denominazione'] || row['Descrizione movimento'] || '',
                            betrag: row['Importo'] || '',
                            dokument: row['Numero documento'] || '',
                            datum: row['Data documento'] || row['Data registrazione'] || ''
                        }
                    });
                    continue;
                }
                excelBookings.push(booking);
            }

            console.log(`✅ ${excelBookings.length} gültige Buchungen in Excel`);

            // 2. Zähle wie oft jeder Key in Excel vorkommt
            const excelKeyCounts = new Map();
            for (const booking of excelBookings) {
                const key = this.generateBookingKey(booking);
                excelKeyCounts.set(key, (excelKeyCounts.get(key) || 0) + 1);
            }
            console.log(`🔑 ${excelKeyCounts.size} unique Keys in Excel`);

            // 3. Lade ALLE existierenden Buchungen aus DB mit Pagination (Supabase 1000-Limit umgehen)
            const existingBookings = [];
            const pageSize = 1000;
            let offset = 0;
            let hasMore = true;
            let pageNum = 0;

            console.log('📚 Lade Buchungen aus DB mit Pagination...');

            while (hasMore) {
                pageNum++;
                const { data: page, error: fetchError } = await SupabaseService.client
                    .from('datev_bookings')
                    .select('konto_nr, datum, betrag, beschreibung')
                    .range(offset, offset + pageSize - 1)
                    .order('id', { ascending: true });

                if (fetchError) {
                    console.error(`❌ Fehler bei Page ${pageNum}:`, fetchError);
                    throw fetchError;
                }

                const pageLength = page ? page.length : 0;
                console.log(`📄 Page ${pageNum}: ${pageLength} Buchungen geladen (offset: ${offset})`);

                if (page && page.length > 0) {
                    existingBookings.push(...page);
                    offset += pageSize;
                    hasMore = page.length === pageSize;
                } else {
                    hasMore = false;
                }
            }

            console.log(`📚 Pagination fertig: ${pageNum} Pages, ${existingBookings.length} Buchungen total`);

            const dbKeyCounts = new Map();
            for (const b of existingBookings) {
                const key = this.generateBookingKey(b);
                dbKeyCounts.set(key, (dbKeyCounts.get(key) || 0) + 1);
            }
            console.log(`✅ ${existingBookings.length} Buchungen in DB, ${dbKeyCounts.size} unique Keys`);

            // 4. Berechne Differenz: Wie viele von jedem Key müssen importiert werden?
            const keysToImport = new Map(); // key -> anzahl zu importieren
            for (const [key, excelCount] of excelKeyCounts) {
                const dbCount = dbKeyCounts.get(key) || 0;
                const diff = excelCount - dbCount;
                if (diff > 0) {
                    keysToImport.set(key, diff);
                    console.log(`📥 Key "${key.substring(0, 40)}...": Excel=${excelCount}, DB=${dbCount}, Import=${diff}`);
                } else if (diff < 0) {
                    console.warn(`⚠️ Mehr in DB als Excel: "${key.substring(0, 40)}...": Excel=${excelCount}, DB=${dbCount}`);
                }
            }

            // 5. Wähle die zu importierenden Buchungen aus
            const bookingsToImport = [];
            const keyImportedCounts = new Map(); // Tracking wie viele pro Key schon ausgewählt

            for (const booking of excelBookings) {
                const key = this.generateBookingKey(booking);
                const needToImport = keysToImport.get(key) || 0;
                const alreadySelected = keyImportedCounts.get(key) || 0;

                if (alreadySelected < needToImport) {
                    // Diese Buchung muss importiert werden
                    keyImportedCounts.set(key, alreadySelected + 1);
                    bookingsToImport.push(booking);
                } else {
                    // Buchung existiert bereits in DB
                    skippedRows.push({
                        rowNumber: booking._rowIndex,
                        reason: 'Bereits in Datenbank vorhanden',
                        reasonCode: 'DUPLICATE_DB',
                        data: {
                            konto: booking.konto_nr || '',
                            fornitore: booking.fornitore_name || '',
                            betrag: booking.betrag,
                            dokument: booking.dokument_nr || '',
                            datum: booking.datum
                        }
                    });
                }
            }

            // _rowIndex entfernen vor dem Insert
            for (const booking of bookingsToImport) {
                delete booking._rowIndex;
            }

            console.log(`🆕 ${bookingsToImport.length} Buchungen zum Import`);

            if (bookingsToImport.length === 0) {
                return {
                    success: true,
                    imported: 0,
                    skipped: skippedRows.length,
                    skippedRows: skippedRows,
                    message: 'Alle Buchungen bereits vorhanden'
                };
            }

            // 6. Import in Supabase in Chunks
            let successCount = 0;
            const errors = [];
            const chunkSize = 50;

            for (let i = 0; i < bookingsToImport.length; i += chunkSize) {
                const chunk = bookingsToImport.slice(i, i + chunkSize);

                const { data: insertedChunk, error: insertError } = await SupabaseService.client
                    .from('datev_bookings')
                    .insert(chunk)
                    .select();

                if (insertError) {
                    // Prüfe ob Chunk-Fehler ein Duplikat ist (409 Conflict oder 23505)
                    const isChunkDuplicate = insertError.code === '23505' ||
                        insertError.code === '409' ||
                        insertError.message?.toLowerCase().includes('duplicate') ||
                        insertError.message?.toLowerCase().includes('conflict') ||
                        insertError.message?.toLowerCase().includes('unique');

                    if (!isChunkDuplicate) {
                        console.error(`❌ Fehler bei Chunk ${i}-${i+chunkSize}:`, insertError);
                    }

                    // Bei Fehler einzeln versuchen
                    for (const booking of chunk) {
                        const { data: singleInsert, error: singleError } = await SupabaseService.client
                            .from('datev_bookings')
                            .insert(booking)
                            .select();

                        if (singleError) {
                            // Duplikat-Erkennung: 409 HTTP, 23505 PG, oder Text-Hinweise
                            const isDuplicate = singleError.code === '23505' ||
                                singleError.code === '409' ||
                                singleError.message?.toLowerCase().includes('duplicate') ||
                                singleError.message?.toLowerCase().includes('conflict') ||
                                singleError.message?.toLowerCase().includes('unique');

                            if (!isDuplicate) {
                                errors.push(singleError.message);
                                console.warn(`⚠️ Nicht-Duplikat-Fehler:`, singleError);
                            }
                            skippedRows.push({
                                rowNumber: '?',
                                reason: isDuplicate ? 'Bereits in DB vorhanden' : `DB-Fehler: ${singleError.message}`,
                                reasonCode: isDuplicate ? 'DUPLICATE_DB' : 'DB_ERROR',
                                data: {
                                    konto: booking.konto_nr || '',
                                    fornitore: booking.fornitore_name || '',
                                    betrag: booking.betrag,
                                    dokument: booking.dokument_nr || '',
                                    datum: booking.datum
                                }
                            });
                        } else if (singleInsert) {
                            successCount += singleInsert.length;
                        }
                    }
                } else if (insertedChunk) {
                    successCount += insertedChunk.length;
                }
            }

            console.log(`✅ ${successCount} Buchungen erfolgreich importiert`);

            // Statistik
            const finalDbCount = existingBookings.length + successCount;
            console.log(`📊 Statistik: Excel=${excelBookings.length}, DB vorher=${existingBookings.length}, DB nachher=${finalDbCount}`);

            // Import ist erfolgreich wenn mindestens etwas importiert wurde oder keine echten Fehler auftraten
            const hasRealErrors = errors.length > 0;
            const importSuccess = successCount > 0 || !hasRealErrors;

            return {
                success: importSuccess,
                imported: successCount,
                skipped: skippedRows.length,
                skippedRows: skippedRows,
                excelTotal: excelBookings.length,
                dbBefore: existingBookings.length,
                dbAfter: finalDbCount,
                errors: hasRealErrors ? errors : undefined,
                message: `${successCount} neue Buchungen importiert, ${skippedRows.length} übersprungen (Excel: ${excelBookings.length}, DB: ${finalDbCount})`
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

            // Gutschrift-Erkennung: NICHT einfach negatives Importo!
            // Erlöskonten (600-679, 840) haben negative Beträge = Habenbuchung, KEINE Gutschrift
            // Kostenkonten (680-850 außer 840) mit negativem Betrag = echte Gutschrift
            ist_gutschrift: (() => {
                const betrag = this.parseDecimal(row['Importo']);
                const konto = String(row['Conto'] || '');
                // Erlöskonten: 600-679 und 840 (Finanzerträge)
                const isErloskonto = konto.startsWith('6') && konto.length >= 3 && parseInt(konto.substring(0, 2)) < 68;
                const isFinanzErtrag = konto.startsWith('84');
                // Nur bei Kostenkonten mit negativem Betrag = Gutschrift
                return betrag < 0 && !isErloskonto && !isFinanzErtrag;
            })(),

            // Beträge - Original-Vorzeichen beibehalten für korrekte Bilanz-Berechnung!
            // Negative Beträge = Storno/Ausbuchung, werden in der Summe abgezogen
            betrag: this.parseDecimal(row['Importo']),
            betrag_netto: this.parseDecimal(row['Importo']),
            betrag_mwst: null, // Nicht im Export enthalten
            betrag_gesamt: this.parseDecimal(row['Importo']),
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

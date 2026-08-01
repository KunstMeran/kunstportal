/**
 * EXCEL IMPORT SERVICE
 * Import von DATEV-Buchungen und Lieferanten aus Excel-Exporten
 * Projektsoftware Kunst Meran
 *
 * Version 2.1 - Überarbeitet:
 * - Intelligente Duplikat-Erkennung (nur fehlende importieren)
 * - Progress-Callback für UI-Feedback
 * - raw: true für bessere Zahlenverarbeitung
 * - Vorzeichen: nur bei Umsatzkonten (6xx) umdrehen
 * - Detaillierte Dokumentation für jede übersprungene Zeile
 */

const ExcelImportService = {

    /**
     * Generiert einen eindeutigen Key für eine Buchung.
     * Wird verwendet um zu prüfen ob eine Buchung bereits in der DB existiert.
     *
     * Key-Felder:
     * - dokument_nr
     * - datum
     * - betrag (gerundet auf 2 Dezimalstellen)
     * - konto_nr
     */
    generateBookingKey(booking) {
        const dokumentNr = String(booking.dokument_nr || '').trim();
        const datum = String(booking.datum || '').trim();

        // Betrag auf 2 Dezimalstellen runden für konsistenten Vergleich
        let betrag = '';
        if (booking.betrag !== null && booking.betrag !== undefined) {
            const num = parseFloat(booking.betrag);
            if (!isNaN(num)) {
                betrag = num.toFixed(2);
            }
        }

        const kontoNr = String(booking.konto_nr || '').trim();

        return `${dokumentNr}|${datum}|${betrag}|${kontoNr}`;
    },

    /**
     * Haupt-Import-Funktion für DATEV-Buchungen
     *
     * @param {File} file - Excel-Datei
     * @param {Object} options - Optionen
     * @param {Function} options.onProgress - Callback für Fortschritt (0-100)
     * @returns {Object} Import-Ergebnis mit detaillierter Statistik
     */
    async importDatevBookings(file, options = {}) {
        const onProgress = options.onProgress || (() => {});
        const skippedRows = [];
        const importedRows = [];

        try {
            console.log('📤 DATEV-Import gestartet:', file.name);
            onProgress(5, 'Excel-Datei wird gelesen...');

            // ============================================
            // SCHRITT 1: Excel-Datei parsen
            // ============================================
            const data = await this.parseExcelFile(file);

            if (!data || data.length === 0) {
                return {
                    success: false,
                    error: 'Keine Daten in Excel-Datei gefunden',
                    imported: 0,
                    skipped: 0,
                    skippedRows: []
                };
            }

            console.log(`📊 ${data.length} Zeilen in Excel gefunden`);
            console.log('📋 Spalten:', Object.keys(data[0]));

            onProgress(10, `${data.length} Zeilen gefunden, lade Lieferanten...`);

            // ============================================
            // SCHRITT 2: Lieferanten für Matching laden
            // ============================================
            const { data: suppliers, error: supplierError } = await SupabaseService.client
                .from('suppliers')
                .select('fornitore_name, partita_iva, fornitore_nr');

            if (supplierError) {
                console.warn('⚠️ Lieferanten konnten nicht geladen werden:', supplierError);
            }

            const supplierMap = new Map();
            if (suppliers) {
                suppliers.forEach(s => {
                    if (s.fornitore_name) {
                        const key = s.fornitore_name.toLowerCase().trim();
                        supplierMap.set(key, {
                            partita_iva: s.partita_iva,
                            fornitore_nr: s.fornitore_nr
                        });
                    }
                });
            }
            console.log(`📇 ${supplierMap.size} Lieferanten für Matching geladen`);

            onProgress(15, 'Lade existierende Buchungen...');

            // ============================================
            // SCHRITT 3: Existierende Buchungen laden (für Duplikat-Check)
            // ============================================
            const { data: existingBookings, error: existingError } = await SupabaseService.client
                .from('datev_bookings')
                .select('dokument_nr, datum, betrag, konto_nr');

            if (existingError) {
                console.warn('⚠️ Existierende Buchungen konnten nicht geladen werden:', existingError);
            }

            // Set mit existierenden Keys erstellen
            const existingKeys = new Set();
            if (existingBookings && existingBookings.length > 0) {
                existingBookings.forEach(b => {
                    const key = this.generateBookingKey(b);
                    existingKeys.add(key);
                });
                console.log(`📚 ${existingKeys.size} existierende Buchungen in DB`);
            } else {
                console.log('📚 Datenbank ist leer - alle Buchungen werden importiert');
            }

            onProgress(20, 'Verarbeite Excel-Zeilen...');

            // ============================================
            // SCHRITT 4: Excel-Zeilen zu Buchungen mappen
            // ============================================
            const bookingsToImport = [];
            const totalRows = data.length;

            for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
                const row = data[rowIndex];
                const excelRowNumber = rowIndex + 2; // +2 weil Header = Zeile 1, Index startet bei 0

                // Progress alle 100 Zeilen aktualisieren
                if (rowIndex % 100 === 0) {
                    const progressPercent = 20 + Math.floor((rowIndex / totalRows) * 40);
                    onProgress(progressPercent, `Verarbeite Zeile ${rowIndex + 1} von ${totalRows}...`);
                }

                // Mapping der Zeile
                const mappingResult = this.mapRowToDatevBooking(row, file.name, supplierMap, excelRowNumber);

                // Wenn Mapping fehlgeschlagen, dokumentieren und überspringen
                if (mappingResult.error) {
                    skippedRows.push({
                        rowNumber: excelRowNumber,
                        reason: mappingResult.error,
                        reasonCode: mappingResult.errorCode,
                        data: {
                            rawRow: this.sanitizeRowForLog(row),
                            konto: row['Conto'] || '',
                            fornitore: row['Denominazione'] || row['Descrizione movimento'] || '',
                            betrag: row['Importo'] || '',
                            dokument: row['Numero documento'] || '',
                            datum: row['Data documento'] || row['Data registrazione'] || ''
                        }
                    });
                    continue;
                }

                const booking = mappingResult.booking;

                // Duplikat-Check: Existiert diese Buchung bereits in der DB?
                const bookingKey = this.generateBookingKey(booking);
                if (existingKeys.has(bookingKey)) {
                    skippedRows.push({
                        rowNumber: excelRowNumber,
                        reason: 'Bereits in Datenbank vorhanden',
                        reasonCode: 'DUPLICATE_EXISTS',
                        data: {
                            konto: booking.konto_nr || '',
                            fornitore: booking.fornitore_name || '',
                            betrag: booking.betrag,
                            dokument: booking.dokument_nr || '',
                            datum: booking.datum,
                            key: bookingKey
                        }
                    });
                    continue;
                }

                // Buchung ist neu - zur Import-Liste hinzufügen
                // Key auch zu existingKeys hinzufügen um Duplikate innerhalb der Excel zu erlauben
                // (gleiche Zeile kann mehrfach vorkommen - wird trotzdem importiert)
                bookingsToImport.push(booking);
                importedRows.push({
                    rowNumber: excelRowNumber,
                    data: {
                        konto: booking.konto_nr,
                        fornitore: booking.fornitore_name,
                        betrag: booking.betrag,
                        dokument: booking.dokument_nr,
                        datum: booking.datum
                    }
                });
            }

            console.log(`✅ ${bookingsToImport.length} neue Buchungen zum Import`);
            console.log(`⏭️ ${skippedRows.length} Zeilen übersprungen`);

            onProgress(60, `${bookingsToImport.length} neue Buchungen werden importiert...`);

            // ============================================
            // SCHRITT 5: Import in Supabase (Chunk-weise)
            // ============================================
            if (bookingsToImport.length === 0) {
                onProgress(100, 'Fertig - keine neuen Buchungen');
                return {
                    success: true,
                    imported: 0,
                    skipped: skippedRows.length,
                    skippedRows: skippedRows,
                    excelTotal: totalRows,
                    message: `Keine neuen Buchungen. ${skippedRows.length} Zeilen übersprungen (bereits vorhanden oder ungültig).`
                };
            }

            let successCount = 0;
            const importErrors = [];
            const chunkSize = 100; // Größere Chunks für bessere Performance
            const totalChunks = Math.ceil(bookingsToImport.length / chunkSize);

            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                const start = chunkIndex * chunkSize;
                const end = Math.min(start + chunkSize, bookingsToImport.length);
                const chunk = bookingsToImport.slice(start, end);

                const progressPercent = 60 + Math.floor((chunkIndex / totalChunks) * 35);
                onProgress(progressPercent, `Importiere Chunk ${chunkIndex + 1} von ${totalChunks}...`);

                const { data: insertedData, error: insertError } = await SupabaseService.client
                    .from('datev_bookings')
                    .insert(chunk)
                    .select('id');

                if (insertError) {
                    console.error(`❌ Fehler bei Chunk ${chunkIndex + 1}:`, insertError);

                    // Bei Fehler: Einzeln versuchen um zu sehen welche Zeilen fehlschlagen
                    for (let i = 0; i < chunk.length; i++) {
                        const singleBooking = chunk[i];
                        const { data: singleResult, error: singleError } = await SupabaseService.client
                            .from('datev_bookings')
                            .insert(singleBooking)
                            .select('id');

                        if (singleError) {
                            const rowInfo = importedRows[start + i];
                            importErrors.push({
                                rowNumber: rowInfo?.rowNumber || '?',
                                error: singleError.message,
                                data: singleBooking
                            });

                            // Zur skippedRows hinzufügen
                            skippedRows.push({
                                rowNumber: rowInfo?.rowNumber || '?',
                                reason: `DB-Fehler: ${singleError.message}`,
                                reasonCode: 'DB_ERROR',
                                data: {
                                    konto: singleBooking.konto_nr || '',
                                    fornitore: singleBooking.fornitore_name || '',
                                    betrag: singleBooking.betrag,
                                    dokument: singleBooking.dokument_nr || '',
                                    datum: singleBooking.datum
                                }
                            });
                        } else {
                            successCount++;
                        }
                    }
                } else {
                    successCount += chunk.length;
                }
            }

            onProgress(100, 'Import abgeschlossen');

            console.log(`✅ ${successCount} Buchungen erfolgreich importiert`);
            if (importErrors.length > 0) {
                console.warn(`⚠️ ${importErrors.length} Fehler beim Import`);
            }

            return {
                success: true,
                imported: successCount,
                skipped: skippedRows.length,
                skippedRows: skippedRows,
                excelTotal: totalRows,
                errors: importErrors.length > 0 ? importErrors : undefined,
                message: `${successCount} Buchungen importiert, ${skippedRows.length} übersprungen`
            };

        } catch (error) {
            console.error('❌ Import-Fehler:', error);
            onProgress(100, 'Fehler beim Import');
            return {
                success: false,
                error: error.message,
                imported: 0,
                skipped: skippedRows.length,
                skippedRows: skippedRows
            };
        }
    },

    /**
     * Excel-Datei parsen mit SheetJS
     * Verwendet raw: true für bessere Zahlenverarbeitung
     */
    async parseExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {
                        type: 'array',
                        raw: true,           // Rohe Werte statt formatierte Strings
                        cellDates: true,     // Datum als Date-Objekt
                        cellNF: true         // Zahlenformat beibehalten
                    });

                    // Erstes Sheet verwenden
                    const firstSheetName = workbook.SheetNames[0];
                    const firstSheet = workbook.Sheets[firstSheetName];

                    // Zu JSON konvertieren
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                        raw: true,           // Rohe Werte
                        defval: null         // Leere Zellen als null
                    });

                    console.log(`📄 Sheet "${firstSheetName}" mit ${jsonData.length} Zeilen geladen`);
                    resolve(jsonData);

                } catch (error) {
                    console.error('❌ Excel-Parse-Fehler:', error);
                    reject(new Error(`Excel konnte nicht gelesen werden: ${error.message}`));
                }
            };

            reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Excel-Zeile zu DATEV-Buchung mappen
     * Gibt entweder { booking: ... } oder { error: ..., errorCode: ... } zurück
     */
    mapRowToDatevBooking(row, fileName, supplierMap, rowNumber) {
        // ============================================
        // DATUM ermitteln (Pflichtfeld)
        // ============================================
        // WICHTIG: Data registrazione (Buchungsdatum) hat Priorität!
        // Data documento kann ein anderes Jahr haben (z.B. Rechnung vom 31.12.2024,
        // aber gebucht am 05.01.2025 → gehört ins Jahr 2025)
        const datumSpalten = [
            'Data registrazione',
            'Data competenza bilancio',
            'Data documento',
            'Data',
            'Datum',
            'Data doc.',
            'Data reg.'
        ];

        let datum = null;
        let datumSource = null;

        // Debug: Zeige alle verfügbaren Spalten die "Data" enthalten
        const allDateColumns = Object.keys(row).filter(k => k.toLowerCase().includes('data'));

        for (const spalte of datumSpalten) {
            if (row[spalte] !== null && row[spalte] !== undefined && row[spalte] !== '') {
                datum = this.parseDate(row[spalte]);
                if (datum) {
                    datumSource = spalte;
                    break;
                }
            }
        }

        // Debug-Logging für erste 5 Zeilen
        if (rowNumber <= 5 || !datum) {
            console.log(`📅 Zeile ${rowNumber}: Verfügbare Datum-Spalten:`, allDateColumns);
            console.log(`   Gewählt: "${datumSource}" = "${datum}"`);
            console.log(`   Data registrazione: "${row['Data registrazione']}"`);
            console.log(`   Data documento: "${row['Data documento']}"`);
        }

        if (!datum) {
            const availableDateFields = datumSpalten
                .filter(s => row[s] !== null && row[s] !== undefined)
                .map(s => `${s}="${row[s]}"`)
                .join(', ');

            return {
                error: `Kein gültiges Datum gefunden. Geprüfte Felder: ${availableDateFields || 'keine'}`,
                errorCode: 'NO_DATE'
            };
        }

        // ============================================
        // BETRAG ermitteln (Pflichtfeld)
        // ============================================
        const betragRaw = row['Importo'];
        if (betragRaw === null || betragRaw === undefined || betragRaw === '') {
            return {
                error: 'Kein Betrag (Importo) vorhanden',
                errorCode: 'NO_AMOUNT'
            };
        }

        const betragParsed = this.parseDecimal(betragRaw);
        if (betragParsed === null || isNaN(betragParsed)) {
            return {
                error: `Betrag "${betragRaw}" konnte nicht als Zahl interpretiert werden`,
                errorCode: 'INVALID_AMOUNT'
            };
        }

        // ============================================
        // KONTO ermitteln
        // ============================================
        const kontoNr = row['Conto'] || null;
        if (!kontoNr) {
            return {
                error: 'Kein Konto (Conto) vorhanden',
                errorCode: 'NO_ACCOUNT'
            };
        }

        // ============================================
        // LIEFERANTENNAME ermitteln
        // ============================================
        let fornitoreName = row['Denominazione'] || '';

        // Fallback: Aus Descrizione movimento extrahieren
        if (!fornitoreName && row['Descrizione movimento']) {
            const descrizione = String(row['Descrizione movimento']).trim();
            const separators = [' - ', ' vom ', ' del '];
            for (const sep of separators) {
                if (descrizione.includes(sep)) {
                    fornitoreName = descrizione.split(sep)[0].trim();
                    break;
                }
            }
        }

        // Letzter Fallback: Kontoname
        if (!fornitoreName) {
            fornitoreName = row['Descrizione conto'] || 'Unbekannt';
        }

        // ============================================
        // LIEFERANTEN-MATCHING (Partita IVA, Fornitore Nr)
        // ============================================
        let partitaIva = null;
        let fornitoreNr = null;

        if (supplierMap && fornitoreName !== 'Unbekannt') {
            const key = fornitoreName.toLowerCase().trim();
            const supplier = supplierMap.get(key);
            if (supplier) {
                partitaIva = supplier.partita_iva;
                fornitoreNr = supplier.fornitore_nr;
            }
        }

        // ============================================
        // VORZEICHEN-LOGIK
        // ============================================
        // Grundregel: Betrag GENAU so übernehmen wie in Excel
        // AUSNAHME: Nur ERTRAGS-Konten (600-679, 840) - Vorzeichen umdrehen
        //   - Diese haben im DATEV negative Beträge für Einnahmen (Habenbuchungen)
        //   - Für korrekte GuV-Darstellung müssen sie positiv sein
        //
        // NICHT umdrehen: Aufwendungen (680+, 690+, 700+, etc.)
        //   - Diese sind im DATEV bereits positiv = Kosten
        //   - Bleiben positiv, Bilanz-Anzeige macht sie dann negativ

        const kontoStr = String(kontoNr);
        const kontoPrefix = parseInt(kontoStr.substring(0, 3)) || 0;

        // Ertragskonten: 600-679 (Umsatzerlöse) und 840-849 (Finanzerträge)
        const isErtragskonto = (kontoPrefix >= 600 && kontoPrefix <= 679) ||
                               (kontoPrefix >= 840 && kontoPrefix <= 849);

        let betrag = betragParsed;
        if (isErtragskonto) {
            betrag = -betragParsed; // Nur Erträge umdrehen
        }

        // ============================================
        // GUTSCHRIFT-ERKENNUNG
        // ============================================
        // Nur bei NICHT-Ertragskonten mit negativem Betrag = Gutschrift
        const istGutschrift = !isErtragskonto && betragParsed < 0;

        // ============================================
        // ALLE DREI DATEN parsen
        // ============================================
        const datumRegistrazione = this.parseDate(row['Data registrazione']);
        const datumDocumento = this.parseDate(row['Data documento']);
        const datumCompetenza = this.parseDate(row['Data competenza bilancio']);

        // Haupt-Datum: Data registrazione (Buchungsdatum) hat Priorität
        // Das ist das Datum das für das Buchungsjahr relevant ist
        const importYear = new Date(datum).getFullYear();

        // ============================================
        // BUCHUNGS-OBJEKT erstellen
        // ============================================
        return {
            booking: {
                import_year: importYear,
                import_file_name: fileName,

                partita_iva: partitaIva,
                partita_iva_cliente: null,
                konto_nr: kontoNr,
                fornitore_nr: fornitoreNr,
                fornitore_name: fornitoreName,
                dokument_nr: row['Numero documento'] || '',
                dokument_typ: 'F',
                ist_gutschrift: istGutschrift,

                betrag: betrag,
                betrag_netto: betragParsed,  // Original-Betrag für Referenz
                betrag_mwst: null,
                betrag_gesamt: betragParsed,
                mwst_typ: null,

                // Alle drei Daten speichern
                datum: datum,                              // Haupt-Datum (Data registrazione)
                datum_registrazione: datumRegistrazione,   // Buchungsdatum
                datum_documento: datumDocumento,           // Rechnungsdatum
                datum_competenza: datumCompetenza,         // Bilanzdatum

                projekt_id: row['Centro di costo'] || null,
                beschreibung: row['Descrizione movimento'] || null,
                kategorie: row['Descrizione conto'] || null
            }
        };
    },

    /**
     * Sanitize Row für Logging (keine sensiblen Daten, gekürzt)
     */
    sanitizeRowForLog(row) {
        const sanitized = {};
        for (const key of Object.keys(row).slice(0, 10)) {
            let value = row[key];
            if (typeof value === 'string' && value.length > 50) {
                value = value.substring(0, 50) + '...';
            }
            sanitized[key] = value;
        }
        return sanitized;
    },

    /**
     * Parse Excel-Datei für Lieferanten
     */
    async importSuppliers(file, options = {}) {
        const onProgress = options.onProgress || (() => {});

        try {
            console.log('📤 Importiere Lieferanten');
            onProgress(10, 'Excel wird gelesen...');

            const data = await this.parseExcelFile(file);
            if (!data || data.length === 0) {
                throw new Error('Keine Daten in Excel-Datei gefunden');
            }

            console.log(`📊 ${data.length} Zeilen gefunden`);
            onProgress(30, 'Verarbeite Lieferanten...');

            // Map zu Supplier-Objekten
            const suppliers = data
                .map(row => this.mapRowToSupplier(row, file.name))
                .filter(s => s.partita_iva);

            console.log(`✅ ${suppliers.length} gültige Lieferanten (mit Partita IVA)`);

            if (suppliers.length === 0) {
                throw new Error('Keine gültigen Lieferanten gefunden (Partita IVA fehlt)');
            }

            // Duplikate in der Excel-Datei entfernen
            const uniqueSuppliers = [];
            const seenPartitaIva = new Set();
            for (const supplier of suppliers) {
                if (!seenPartitaIva.has(supplier.partita_iva)) {
                    seenPartitaIva.add(supplier.partita_iva);
                    uniqueSuppliers.push(supplier);
                }
            }

            console.log(`🔄 ${suppliers.length - uniqueSuppliers.length} Duplikate entfernt`);
            onProgress(50, 'Speichere in Datenbank...');

            // Upsert
            const { data: upsertedData, error: upsertError } = await SupabaseService.client
                .from('suppliers')
                .upsert(uniqueSuppliers, {
                    onConflict: 'partita_iva',
                    ignoreDuplicates: true
                })
                .select();

            if (upsertError) throw upsertError;

            console.log(`✅ ${upsertedData.length} Lieferanten importiert/aktualisiert`);
            onProgress(80, 'Aktualisiere DATEV-Buchungen...');

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
            onProgress(100, 'Fertig');

            return {
                success: true,
                imported: upsertedData.length,
                updatedBookings: updatedBookings,
                message: `${upsertedData.length} Lieferanten importiert, ${updatedBookings} Buchungen aktualisiert`
            };

        } catch (error) {
            console.error('❌ Import-Fehler:', error);
            onProgress(100, 'Fehler');
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Excel-Zeile zu Lieferant mappen
     */
    mapRowToSupplier(row, fileName) {
        // Partita IVA aus verschiedenen Spalten
        let partitaIva = row['Partita IVA'] || row['CodiceFisc'] || row['P.IVA'] || null;

        // Als String konvertieren
        if (partitaIva && typeof partitaIva === 'number') {
            partitaIva = String(Math.round(partitaIva));
        }
        if (partitaIva) {
            partitaIva = String(partitaIva).trim();
        }

        // IT-Prefix hinzufügen wenn nötig
        if (partitaIva && !partitaIva.startsWith('IT') && !partitaIva.startsWith('DE') &&
            !partitaIva.startsWith('AT') && !partitaIva.startsWith('CF:')) {
            partitaIva = 'IT' + partitaIva;
        }

        // Ausländische Lieferanten
        const partitaIvaEstera = row['Partita IVA estera'];
        const idIso = row['IDISO'];
        if (partitaIvaEstera && idIso) {
            partitaIva = idIso + partitaIvaEstera;
        }

        // Codice Fiscale als Fallback
        const codiceFiscale = row['Codice fiscale'] || row['CodiceFisc'] || row['C.F.'] || null;
        if (!partitaIva && codiceFiscale) {
            partitaIva = 'CF:' + codiceFiscale;
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
     * Helper: Decimal parsen (europäisches + US Format)
     */
    parseDecimal(value) {
        if (value === null || value === undefined || value === '') return null;

        // Bereits eine Zahl
        if (typeof value === 'number') return value;

        let str = String(value).trim();

        // Leerer String
        if (str === '') return null;

        const hasComma = str.includes(',');
        const hasDot = str.includes('.');

        if (hasComma && hasDot) {
            const lastComma = str.lastIndexOf(',');
            const lastDot = str.lastIndexOf('.');

            if (lastComma > lastDot) {
                // Europäisch: 1.234,56
                str = str.replace(/\./g, '').replace(',', '.');
            } else {
                // US: 1,234.56
                str = str.replace(/,/g, '');
            }
        } else if (hasComma && !hasDot) {
            // Nur Komma: 1234,56
            str = str.replace(',', '.');
        }

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
            return lower === 'true' || lower === 'ja' || lower === 'yes' || lower === '1' || lower === 'sì';
        }
        return Boolean(value);
    },

    /**
     * Helper: Datum parsen (mehrere Formate)
     */
    parseDate(value) {
        if (!value) return null;

        // Bereits ein Date-Objekt (von SheetJS mit cellDates: true)
        if (value instanceof Date) {
            if (isNaN(value.getTime())) return null;
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // ISO-Format: 2026-06-04
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
        }

        // DD.MM.YYYY oder DD/MM/YYYY
        if (typeof value === 'string' && /^\d{1,2}[./]\d{1,2}[./]\d{4}$/.test(value)) {
            const parts = value.split(/[./]/);
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }

        // Excel Serial Number (Tage seit 1900-01-01)
        if (typeof value === 'number' && value > 0 && value < 100000) {
            const excelEpoch = new Date(1900, 0, 1);
            const days = value - 2; // Excel Off-by-2 Bug
            const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);

            if (isNaN(date.getTime())) return null;

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // Fallback: Date-Objekt erstellen
        if (typeof value === 'string') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        }

        console.warn('⚠️ Datum konnte nicht geparst werden:', value, typeof value);
        return null;
    },

    /**
     * Alle Jahre mit DATEV-Buchungen abrufen
     */
    async getAvailableYears() {
        try {
            const { data, error } = await SupabaseService.client
                .from('datev_bookings')
                .select('import_year')
                .order('import_year', { ascending: false });

            if (error) throw error;

            const years = [...new Set(data.map(b => b.import_year).filter(y => y))];
            return years;

        } catch (error) {
            console.error('❌ Fehler beim Laden der Jahre:', error);
            return [];
        }
    }
};

console.log('📊 Excel Import Service v2.1 geladen');

' ============================================
' DATEV Import Script für Projektsoftware Kunst Meran
' Version: 1.0.0
' ============================================
'
' Dieses Skript:
' 1. Liest die DATEV-Export Excel-Datei
' 2. Scannt den EK-Rechnungen Ordner für PDFs
' 3. Verknüpft Buchungen mit PDFs via PartitaIVA_Rechnungsnummer
' 4. Generiert buchungen.json für die Web-Anwendung
'
' Ausführung: Doppelklick auf diese Datei
' ============================================

Option Explicit

Dim objFSO, objExcel, objWorkbook, objSheet
Dim strScriptPath, strBasePath, strDatevPath, strPdfPath, strOutputPath
Dim objJSON, arrBuchungen, arrLieferanten, objProjekte
Dim i, lastRow, pdfFile, pdfExists

' FileSystemObject erstellen
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Pfade ermitteln
strScriptPath = objFSO.GetParentFolderName(WScript.ScriptFullName)
strBasePath = objFSO.GetParentFolderName(strScriptPath)
strDatevPath = strBasePath & "\DATEV Exporte"
strPdfPath = strBasePath & "\EK-Rechnungen"
strOutputPath = strBasePath & "\data"

' Ausgabe-Ordner erstellen falls nicht vorhanden
If Not objFSO.FolderExists(strOutputPath) Then
    objFSO.CreateFolder(strOutputPath)
End If

' Prüfen ob DATEV-Export Ordner existiert
If Not objFSO.FolderExists(strDatevPath) Then
    MsgBox "DATEV Export Ordner nicht gefunden:" & vbCrLf & strDatevPath, vbCritical, "Fehler"
    WScript.Quit
End If

' Excel-Datei finden
Dim strExcelFile
strExcelFile = FindExcelFile(strDatevPath)

If strExcelFile = "" Then
    MsgBox "Keine Excel-Datei im DATEV Export Ordner gefunden:" & vbCrLf & strDatevPath, vbCritical, "Fehler"
    WScript.Quit
End If

' Excel öffnen
On Error Resume Next
Set objExcel = CreateObject("Excel.Application")
If Err.Number <> 0 Then
    MsgBox "Excel konnte nicht gestartet werden. Bitte stellen Sie sicher, dass Microsoft Excel installiert ist.", vbCritical, "Fehler"
    WScript.Quit
End If
On Error GoTo 0

objExcel.Visible = False
objExcel.DisplayAlerts = False

On Error Resume Next
Set objWorkbook = objExcel.Workbooks.Open(strExcelFile)
If Err.Number <> 0 Then
    MsgBox "Excel-Datei konnte nicht geöffnet werden:" & vbCrLf & strExcelFile, vbCritical, "Fehler"
    objExcel.Quit
    WScript.Quit
End If
On Error GoTo 0

Set objSheet = objWorkbook.Sheets(1)

' Spalten-Mapping ermitteln (Zeile 1 = Header)
Dim colPartitaIva, colFornitoreNr, colFornitoreName, colDokumentNr
Dim colBetrag, colDatum, colProjektId, colBeschreibung
Dim colKategorie

colPartitaIva = FindColumn(objSheet, Array("Partita IVA", "P.IVA", "PartitaIVA", "VAT", "Codice Fiscale"))
colFornitoreNr = FindColumn(objSheet, Array("Numero fornitore", "Fornitore Nr", "Nr. Fornitore", "Lieferantennr"))
colFornitoreName = FindColumn(objSheet, Array("Denominazione", "Nome fornitore", "Fornitore", "Ragione sociale", "Lieferant", "Name", "Bezeichnung", "Lieferantenname", "Firmenname", "Firma", "Kreditor", "Kreditorname", "Konto", "Kontobezeichnung", "Gegenkonto Bezeichnung", "Kreditoren", "Gesellschaft", "Unternehmensname"))
colDokumentNr = FindColumn(objSheet, Array("Numero documento", "Nr. Documento", "Documento", "Rechnungsnr", "Fattura"))
colBetrag = FindColumn(objSheet, Array("Importo", "Betrag", "Amount", "Totale", "Imponibile"))
colDatum = FindColumn(objSheet, Array("Data", "Datum", "Date", "Data documento", "Data fattura"))
colProjektId = FindColumn(objSheet, Array("Projekt-ID", "Projekt", "Project", "Progetto", "Centro di costo"))
colBeschreibung = FindColumn(objSheet, Array("Beschreibung", "Description", "Descrizione", "Note", "Causale"))
colKategorie = FindColumn(objSheet, Array("Kategorie", "Category", "Categoria", "Tipo"))
Dim colMwstTyp, colPartitaIvaCliente, colDokumentTyp
colMwstTyp = FindColumn(objSheet, Array("MwSt-Typ", "MwSt Typ", "MwstTyp", "IVA-Typ", "Tax Type", "Tipo IVA"))
colPartitaIvaCliente = FindColumn(objSheet, Array("Partita IVA Cliente", "P.IVA Cliente", "Cliente P.IVA", "Sponsor", "Kunde"))
colDokumentTyp = FindColumn(objSheet, Array("Tipo Documento", "Documento Tipo", "Doc Type", "Belegart", "F/NC"))

' Debug: Alle Spaltenüberschriften auslesen und in Log-Datei schreiben
Dim strLogPath, strLogContent, colIdx
strLogPath = strOutputPath & "\import_debug.log"
strLogContent = "DATEV Import Debug Log - " & Now & vbCrLf
strLogContent = strLogContent & "Excel-Datei: " & strExcelFile & vbCrLf
strLogContent = strLogContent & "============================================" & vbCrLf
strLogContent = strLogContent & "Gefundene Spaltenüberschriften:" & vbCrLf

For colIdx = 1 To objSheet.UsedRange.Columns.Count
    Dim headerVal
    headerVal = Trim(CStr(objSheet.Cells(1, colIdx).Value))
    strLogContent = strLogContent & "Spalte " & colIdx & ": """ & headerVal & """" & vbCrLf
Next

strLogContent = strLogContent & "============================================" & vbCrLf
strLogContent = strLogContent & "Spalten-Mapping Ergebnis:" & vbCrLf
strLogContent = strLogContent & "Partita IVA: " & IIf(colPartitaIva > 0, "Spalte " & colPartitaIva, "NICHT GEFUNDEN") & vbCrLf
strLogContent = strLogContent & "Fornitore Nr: " & IIf(colFornitoreNr > 0, "Spalte " & colFornitoreNr, "NICHT GEFUNDEN") & vbCrLf
strLogContent = strLogContent & "Fornitore Name: " & IIf(colFornitoreName > 0, "Spalte " & colFornitoreName, "NICHT GEFUNDEN") & vbCrLf
strLogContent = strLogContent & "Dokument Nr: " & IIf(colDokumentNr > 0, "Spalte " & colDokumentNr, "NICHT GEFUNDEN") & vbCrLf
strLogContent = strLogContent & "Betrag: " & IIf(colBetrag > 0, "Spalte " & colBetrag, "NICHT GEFUNDEN") & vbCrLf
strLogContent = strLogContent & "Datum: " & IIf(colDatum > 0, "Spalte " & colDatum, "NICHT GEFUNDEN") & vbCrLf
strLogContent = strLogContent & "Projekt-ID: " & IIf(colProjektId > 0, "Spalte " & colProjektId, "NICHT GEFUNDEN") & vbCrLf
strLogContent = strLogContent & "Beschreibung: " & IIf(colBeschreibung > 0, "Spalte " & colBeschreibung, "NICHT GEFUNDEN") & vbCrLf
strLogContent = strLogContent & "MwSt-Typ: " & IIf(colMwstTyp > 0, "Spalte " & colMwstTyp, "NICHT GEFUNDEN") & vbCrLf
strLogContent = strLogContent & "Dokument-Typ: " & IIf(colDokumentTyp > 0, "Spalte " & colDokumentTyp, "NICHT GEFUNDEN") & vbCrLf
strLogContent = strLogContent & "============================================" & vbCrLf

' Log-Datei schreiben
Dim objLogStream
Set objLogStream = CreateObject("ADODB.Stream")
objLogStream.Type = 2
objLogStream.Charset = "UTF-8"
objLogStream.Open
objLogStream.WriteText strLogContent
objLogStream.SaveToFile strLogPath, 2
objLogStream.Close
Set objLogStream = Nothing

' Mindestens benötigte Spalten prüfen
If colPartitaIva = 0 Or colDokumentNr = 0 Then
    MsgBox "Wichtige Spalten nicht gefunden!" & vbCrLf & _
           "Benötigt: Partita IVA und Numero documento" & vbCrLf & vbCrLf & _
           "Gefundene Spalten:" & vbCrLf & _
           "Partita IVA: " & IIf(colPartitaIva > 0, "Spalte " & colPartitaIva, "NICHT GEFUNDEN") & vbCrLf & _
           "Documento: " & IIf(colDokumentNr > 0, "Spalte " & colDokumentNr, "NICHT GEFUNDEN") & vbCrLf & vbCrLf & _
           "Debug-Log gespeichert unter:" & vbCrLf & strLogPath, _
           vbCritical, "Spalten-Fehler"
    objWorkbook.Close False
    objExcel.Quit
    WScript.Quit
End If

' Letzte Zeile mit Daten finden
lastRow = objSheet.UsedRange.Rows.Count

' Daten einlesen
Dim dictLieferanten, dictProjekte
Set dictLieferanten = CreateObject("Scripting.Dictionary")
Set dictProjekte = CreateObject("Scripting.Dictionary")

' Projekt-Stammdaten (fest definiert)
dictProjekte.Add "2601", CreateProjectObj("2601", "Complice")
dictProjekte.Add "2602", CreateProjectObj("2602", "Animacies")
dictProjekte.Add "2603", CreateProjectObj("2603", "Stadtraum Meran")
dictProjekte.Add "2604", CreateProjectObj("2604", "Wanderausstellung")
dictProjekte.Add "2605", CreateProjectObj("2605", "Konzertreihe")
dictProjekte.Add "2606", CreateProjectObj("2606", "Menschenbilder")
dictProjekte.Add "2607", CreateProjectObj("2607", "Rahmenprogramm")

' PDF-Dateien scannen
Dim dictPDFs
Set dictPDFs = CreateObject("Scripting.Dictionary")

If objFSO.FolderExists(strPdfPath) Then
    Dim objFolder, objFile
    Set objFolder = objFSO.GetFolder(strPdfPath)
    For Each objFile In objFolder.Files
        If LCase(objFSO.GetExtensionName(objFile.Name)) = "pdf" Then
            ' Dateiname ohne Extension als Key
            dictPDFs.Add LCase(objFSO.GetBaseName(objFile.Name)), objFile.Name
        End If
    Next
End If

' JSON String aufbauen
Dim jsonOutput, buchungId
buchungId = 0

jsonOutput = "{" & vbCrLf
jsonOutput = jsonOutput & "  ""lastUpdate"": """ & FormatDateTime(Now, vbGeneralDate) & """," & vbCrLf
jsonOutput = jsonOutput & "  ""buchungen"": [" & vbCrLf

Dim firstBuchung
firstBuchung = True

' Daten ab Zeile 2 (nach Header) einlesen
For i = 2 To lastRow
    Dim partitaIva, fornitoreNr, fornitoreName, dokumentNr
    Dim betrag, datum, projektId, beschreibung, kategorie

    partitaIva = Trim(CStr(objSheet.Cells(i, colPartitaIva).Value))
    dokumentNr = Trim(CStr(objSheet.Cells(i, colDokumentNr).Value))

    ' Zeile überspringen wenn keine Daten
    If partitaIva = "" And dokumentNr = "" Then
        ' Skip empty rows
    Else
        buchungId = buchungId + 1

        ' Optionale Spalten
        If colFornitoreNr > 0 Then fornitoreNr = Trim(CStr(objSheet.Cells(i, colFornitoreNr).Value)) Else fornitoreNr = ""
        If colFornitoreName > 0 Then fornitoreName = Trim(CStr(objSheet.Cells(i, colFornitoreName).Value)) Else fornitoreName = ""
        If colBetrag > 0 Then betrag = objSheet.Cells(i, colBetrag).Value Else betrag = 0
        If colDatum > 0 Then datum = objSheet.Cells(i, colDatum).Value Else datum = ""
        If colProjektId > 0 Then projektId = Trim(CStr(objSheet.Cells(i, colProjektId).Value)) Else projektId = ""
        If colBeschreibung > 0 Then beschreibung = Trim(CStr(objSheet.Cells(i, colBeschreibung).Value)) Else beschreibung = ""

        ' WICHTIG: Wenn kein Lieferantenname gefunden, Beschreibung als Lieferantenname verwenden
        If fornitoreName = "" And beschreibung <> "" Then
            fornitoreName = beschreibung
        End If
        If colKategorie > 0 Then kategorie = Trim(CStr(objSheet.Cells(i, colKategorie).Value)) Else kategorie = ""

        ' Partita IVA Cliente (für Sponsoring/Projekt-Zuordnung)
        Dim partitaIvaCliente
        If colPartitaIvaCliente > 0 Then
            partitaIvaCliente = Trim(CStr(objSheet.Cells(i, colPartitaIvaCliente).Value))
        Else
            partitaIvaCliente = ""
        End If

        ' Dokument-Typ (F=Fattura, NC=Nota Credito/Gutschrift)
        Dim dokumentTyp, istGutschrift
        If colDokumentTyp > 0 Then
            dokumentTyp = UCase(Trim(CStr(objSheet.Cells(i, colDokumentTyp).Value)))
        Else
            dokumentTyp = "F" ' Standard: Fattura (Rechnung)
        End If
        ' Gutschrift erkennen
        istGutschrift = False
        If dokumentTyp = "NC" Or dokumentTyp = "NOTA CREDITO" Or dokumentTyp = "GUTSCHRIFT" Or dokumentTyp = "CREDIT" Then
            istGutschrift = True
            dokumentTyp = "NC"
        Else
            dokumentTyp = "F"
        End If

        ' MwSt-Typ lesen (B=Brutto, N=Netto, I=Import, 0=befreit)
        ' STANDARD IST JETZT NETTO (ohne IVA) - da DATEV Beträge ohne IVA exportiert
        Dim mwstTyp
        If colMwstTyp > 0 Then
            mwstTyp = UCase(Trim(CStr(objSheet.Cells(i, colMwstTyp).Value)))
        Else
            mwstTyp = "N" ' Standard: Netto (ohne IVA) - GEÄNDERT!
        End If
        ' Mapping auf interne Typen
        Dim mwstTypIntern
        Select Case mwstTyp
            Case "B", "BRUTTO"
                mwstTypIntern = "brutto_it"
            Case "N", "NETTO", "RC", "REVERSE", ""
                mwstTypIntern = "netto_reverse"  ' Standard für Italien: Netto + 22% IVA
            Case "I", "IMPORT"
                mwstTypIntern = "netto_import"
            Case "0", "BEFREIT", "ESENTE"
                mwstTypIntern = "netto_befreit"
            Case Else
                mwstTypIntern = "netto_reverse" ' Standard: Netto
        End Select

        ' Betrag konvertieren
        If IsNumeric(betrag) Then
            betrag = CDbl(betrag)
        Else
            betrag = 0
        End If

        ' Bei Gutschrift: Betrag negativ machen (falls noch positiv)
        If istGutschrift And betrag > 0 Then
            betrag = -betrag
        End If

        ' Netto/MwSt berechnen basierend auf MwSt-Typ
        Dim betragNetto, betragMwst, betragGesamt
        Select Case mwstTypIntern
            Case "brutto_it"
                ' Brutto eingegeben, Netto zurückrechnen
                betragGesamt = betrag
                betragNetto = betrag / 1.22
                betragMwst = betrag - betragNetto
            Case "netto_reverse", "netto_import"
                ' Netto eingegeben, MwSt draufrechnen
                betragNetto = betrag
                betragMwst = betrag * 0.22
                betragGesamt = betrag + betragMwst
            Case "netto_befreit"
                ' Netto = Gesamt, keine MwSt
                betragNetto = betrag
                betragMwst = 0
                betragGesamt = betrag
            Case Else
                betragGesamt = betrag
                betragNetto = betrag / 1.22
                betragMwst = betrag - betragNetto
        End Select

        ' Datum formatieren
        If IsDate(datum) Then
            datum = Year(datum) & "-" & Right("0" & Month(datum), 2) & "-" & Right("0" & Day(datum), 2)
        Else
            datum = ""
        End If

        ' Rechnungsnummer bereinigen für Dateinamen
        ' Variante 1: Punkte statt Sonderzeichen (für Anzeige)
        Dim dokumentNrClean
        dokumentNrClean = Replace(dokumentNr, "/", ".")
        dokumentNrClean = Replace(dokumentNrClean, "\", ".")
        dokumentNrClean = Replace(dokumentNrClean, ":", "")

        ' Variante 2: Sonderzeichen komplett entfernen (für PDF-Matching)
        ' Die PDF-Dateien haben oft keine Punkte/Striche in der Rechnungsnummer
        Dim dokumentNrForPdf
        dokumentNrForPdf = Replace(dokumentNr, "/", "")
        dokumentNrForPdf = Replace(dokumentNrForPdf, "\", "")
        dokumentNrForPdf = Replace(dokumentNrForPdf, ":", "")
        dokumentNrForPdf = Replace(dokumentNrForPdf, ".", "")
        dokumentNrForPdf = Replace(dokumentNrForPdf, "-", "")
        dokumentNrForPdf = Replace(dokumentNrForPdf, " ", "")

        ' Variante 3: Nur Zahlen extrahieren (z.B. "A-7063" -> "7063")
        Dim dokumentNrNumbers
        dokumentNrNumbers = ExtractNumbers(dokumentNr)

        ' PDF-Dateiname ermitteln - mehrere Varianten prüfen
        Dim expectedPdfName, expectedPdfName2, expectedPdfName3
        expectedPdfName = LCase(partitaIva & "_" & dokumentNrClean)
        expectedPdfName2 = LCase(partitaIva & "_" & dokumentNrForPdf)
        expectedPdfName3 = LCase(partitaIva & "_" & dokumentNrNumbers)

        ' PDF prüfen - mehrere Varianten
        If dictPDFs.Exists(expectedPdfName) Then
            ' Variante 1: Mit Punkten (z.B. IT123_14.F.pdf)
            pdfFile = dictPDFs(expectedPdfName)
            pdfExists = True
        ElseIf dictPDFs.Exists(expectedPdfName2) Then
            ' Variante 2: Ohne Sonderzeichen (z.B. IT123_14F.pdf)
            pdfFile = dictPDFs(expectedPdfName2)
            pdfExists = True
        ElseIf dokumentNrNumbers <> "" And dictPDFs.Exists(expectedPdfName3) Then
            ' Variante 3: Nur Zahlen (z.B. IT123_7063.pdf für Rechnung A-7063)
            pdfFile = dictPDFs(expectedPdfName3)
            pdfExists = True
        Else
            ' PDF nicht gefunden - erwarteten Dateinamen speichern
            pdfFile = partitaIva & "_" & dokumentNrClean & ".pdf"
            pdfExists = False
        End If

        ' Lieferant zur Liste hinzufügen
        If partitaIva <> "" And Not dictLieferanten.Exists(partitaIva) Then
            dictLieferanten.Add partitaIva, Array(fornitoreNr, fornitoreName, 1)
        ElseIf partitaIva <> "" Then
            Dim arrLief
            arrLief = dictLieferanten(partitaIva)
            arrLief(2) = arrLief(2) + 1
            dictLieferanten(partitaIva) = arrLief
        End If

        ' Projekt-Summe aktualisieren
        If projektId <> "" And dictProjekte.Exists(projektId) Then
            Dim arrProj
            arrProj = dictProjekte(projektId)
            arrProj(2) = arrProj(2) + betrag
            dictProjekte(projektId) = arrProj
        End If

        ' JSON-Eintrag
        If Not firstBuchung Then
            jsonOutput = jsonOutput & "," & vbCrLf
        End If
        firstBuchung = False

        jsonOutput = jsonOutput & "    {" & vbCrLf
        jsonOutput = jsonOutput & "      ""id"": " & buchungId & "," & vbCrLf
        jsonOutput = jsonOutput & "      ""partitaIva"": """ & EscapeJSON(partitaIva) & """," & vbCrLf
        jsonOutput = jsonOutput & "      ""partitaIvaCliente"": """ & EscapeJSON(partitaIvaCliente) & """," & vbCrLf
        jsonOutput = jsonOutput & "      ""fornitoreNr"": """ & EscapeJSON(fornitoreNr) & """," & vbCrLf
        jsonOutput = jsonOutput & "      ""fornitoreName"": """ & EscapeJSON(fornitoreName) & """," & vbCrLf
        jsonOutput = jsonOutput & "      ""dokumentNr"": """ & EscapeJSON(dokumentNr) & """," & vbCrLf
        jsonOutput = jsonOutput & "      ""dokumentTyp"": """ & dokumentTyp & """," & vbCrLf
        jsonOutput = jsonOutput & "      ""istGutschrift"": " & BoolToJSON(istGutschrift) & "," & vbCrLf
        jsonOutput = jsonOutput & "      ""betrag"": " & Replace(CStr(betrag), ",", ".") & "," & vbCrLf
        jsonOutput = jsonOutput & "      ""betragNetto"": " & Replace(FormatNumber(betragNetto, 2, -1, 0, 0), ",", ".") & "," & vbCrLf
        jsonOutput = jsonOutput & "      ""betragMwst"": " & Replace(FormatNumber(betragMwst, 2, -1, 0, 0), ",", ".") & "," & vbCrLf
        jsonOutput = jsonOutput & "      ""betragGesamt"": " & Replace(FormatNumber(betragGesamt, 2, -1, 0, 0), ",", ".") & "," & vbCrLf
        jsonOutput = jsonOutput & "      ""mwstTyp"": """ & mwstTypIntern & """," & vbCrLf
        jsonOutput = jsonOutput & "      ""datum"": """ & datum & """," & vbCrLf
        jsonOutput = jsonOutput & "      ""projektId"": """ & EscapeJSON(projektId) & """," & vbCrLf
        jsonOutput = jsonOutput & "      ""beschreibung"": """ & EscapeJSON(beschreibung) & """," & vbCrLf
        jsonOutput = jsonOutput & "      ""kategorie"": """ & EscapeJSON(kategorie) & """," & vbCrLf
        jsonOutput = jsonOutput & "      ""pdfFile"": """ & EscapeJSON(pdfFile) & """," & vbCrLf
        jsonOutput = jsonOutput & "      ""pdfExists"": " & BoolToJSON(pdfExists) & vbCrLf
        jsonOutput = jsonOutput & "    }"
    End If
Next

jsonOutput = jsonOutput & vbCrLf & "  ]," & vbCrLf

' Lieferanten-Array
jsonOutput = jsonOutput & "  ""lieferanten"": [" & vbCrLf
Dim firstLief, key
firstLief = True
For Each key In dictLieferanten.Keys
    Dim liefArr
    liefArr = dictLieferanten(key)

    If Not firstLief Then
        jsonOutput = jsonOutput & "," & vbCrLf
    End If
    firstLief = False

    jsonOutput = jsonOutput & "    {" & vbCrLf
    jsonOutput = jsonOutput & "      ""partitaIva"": """ & EscapeJSON(key) & """," & vbCrLf
    jsonOutput = jsonOutput & "      ""nummer"": """ & EscapeJSON(CStr(liefArr(0))) & """," & vbCrLf
    jsonOutput = jsonOutput & "      ""name"": """ & EscapeJSON(CStr(liefArr(1))) & """," & vbCrLf
    jsonOutput = jsonOutput & "      ""anzahlRechnungen"": " & liefArr(2) & vbCrLf
    jsonOutput = jsonOutput & "    }"
Next
jsonOutput = jsonOutput & vbCrLf & "  ]," & vbCrLf

' Projekte-Objekt
jsonOutput = jsonOutput & "  ""projekte"": {" & vbCrLf
Dim firstProj
firstProj = True
For Each key In dictProjekte.Keys
    Dim projArr
    projArr = dictProjekte(key)

    If Not firstProj Then
        jsonOutput = jsonOutput & "," & vbCrLf
    End If
    firstProj = False

    jsonOutput = jsonOutput & "    """ & key & """: {" & vbCrLf
    jsonOutput = jsonOutput & "      ""name"": """ & EscapeJSON(CStr(projArr(1))) & """," & vbCrLf
    jsonOutput = jsonOutput & "      ""summe"": " & Replace(CStr(projArr(2)), ",", ".") & vbCrLf
    jsonOutput = jsonOutput & "    }"
Next
jsonOutput = jsonOutput & vbCrLf & "  }," & vbCrLf

' Statistiken
Dim pdfCount
pdfCount = dictPDFs.Count

jsonOutput = jsonOutput & "  ""statistik"": {" & vbCrLf
jsonOutput = jsonOutput & "    ""anzahlBuchungen"": " & buchungId & "," & vbCrLf
jsonOutput = jsonOutput & "    ""anzahlLieferanten"": " & dictLieferanten.Count & "," & vbCrLf
jsonOutput = jsonOutput & "    ""anzahlPDFs"": " & pdfCount & vbCrLf
jsonOutput = jsonOutput & "  }" & vbCrLf
jsonOutput = jsonOutput & "}"

' Excel schließen
objWorkbook.Close False
objExcel.Quit

' ============================================
' BACKUP erstellen vor dem Überschreiben
' ============================================
Dim strBuchungenPath, strBackupPath, strBackupFolder
strBuchungenPath = strOutputPath & "\buchungen.json"
strBackupFolder = strOutputPath & "\backups"

' Backup-Ordner erstellen falls nicht vorhanden
If Not objFSO.FolderExists(strBackupFolder) Then
    objFSO.CreateFolder(strBackupFolder)
End If

' Wenn buchungen.json existiert, Backup erstellen
If objFSO.FileExists(strBuchungenPath) Then
    Dim strTimestamp, strBackupFilename
    strTimestamp = Year(Now) & Right("0" & Month(Now), 2) & Right("0" & Day(Now), 2) & "_" & _
                   Right("0" & Hour(Now), 2) & Right("0" & Minute(Now), 2) & Right("0" & Second(Now), 2)
    strBackupFilename = "buchungen_backup_" & strTimestamp & ".json"
    strBackupPath = strBackupFolder & "\" & strBackupFilename

    ' Datei kopieren
    objFSO.CopyFile strBuchungenPath, strBackupPath

    ' Log aktualisieren
    strLogContent = strLogContent & "Backup erstellt: " & strBackupFilename & vbCrLf

    ' Alte Backups aufräumen (behalte nur die letzten 10)
    CleanOldBackups strBackupFolder, 10
End If

' JSON-Datei schreiben (UTF-8 ohne BOM)
Dim objStream
Set objStream = CreateObject("ADODB.Stream")
objStream.Type = 2 ' adTypeText
objStream.Charset = "UTF-8"
objStream.Open
objStream.WriteText jsonOutput
objStream.SaveToFile strBuchungenPath, 2 ' adSaveCreateOverWrite
objStream.Close
Set objStream = Nothing

' Warnung erstellen falls Lieferantennamen fehlen
Dim strWarning
strWarning = ""
If colFornitoreName = 0 Then
    strWarning = vbCrLf & vbCrLf & "WARNUNG: Lieferantennamen-Spalte nicht gefunden!" & vbCrLf & _
                 "Prüfen Sie die Debug-Log unter:" & vbCrLf & strLogPath
End If

' Backup-Info für Meldung
Dim strBackupInfo
If objFSO.FileExists(strBackupPath) Then
    strBackupInfo = vbCrLf & "Backup erstellt: " & strBackupFilename
Else
    strBackupInfo = ""
End If

' Erfolgsmeldung
MsgBox "Import erfolgreich!" & vbCrLf & vbCrLf & _
       "Buchungen importiert: " & buchungId & vbCrLf & _
       "Lieferanten gefunden: " & dictLieferanten.Count & vbCrLf & _
       "PDF-Dateien gefunden: " & pdfCount & strBackupInfo & vbCrLf & vbCrLf & _
       "Ausgabe: " & strOutputPath & "\buchungen.json" & strWarning, _
       vbInformation, "DATEV Import"

' Aufräumen
Set dictLieferanten = Nothing
Set dictProjekte = Nothing
Set dictPDFs = Nothing
Set objSheet = Nothing
Set objWorkbook = Nothing
Set objExcel = Nothing
Set objFSO = Nothing

WScript.Quit

' ============================================
' HILFSFUNKTIONEN
' ============================================

Function FindExcelFile(folderPath)
    Dim fso, folder, file
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set folder = fso.GetFolder(folderPath)

    FindExcelFile = ""

    For Each file In folder.Files
        Dim ext
        ext = LCase(fso.GetExtensionName(file.Name))
        If ext = "xls" Or ext = "xlsx" Or ext = "xlsm" Then
            FindExcelFile = file.Path
            Exit Function
        End If
    Next
End Function

Function FindColumn(sheet, searchTerms)
    Dim col, term, cellValue
    FindColumn = 0

    For col = 1 To sheet.UsedRange.Columns.Count
        cellValue = LCase(Trim(CStr(sheet.Cells(1, col).Value)))
        For Each term In searchTerms
            If InStr(1, cellValue, LCase(term), vbTextCompare) > 0 Then
                FindColumn = col
                Exit Function
            End If
        Next
    Next
End Function

Function EscapeJSON(str)
    If IsNull(str) Then
        EscapeJSON = ""
        Exit Function
    End If

    Dim result
    result = CStr(str)
    result = Replace(result, "\", "\\")
    result = Replace(result, """", "\""")
    result = Replace(result, vbCr, "")
    result = Replace(result, vbLf, "")
    result = Replace(result, vbTab, " ")
    EscapeJSON = result
End Function

Function CreateProjectObj(id, name)
    CreateProjectObj = Array(id, name, 0) ' ID, Name, Summe
End Function

Function IIf(condition, trueVal, falseVal)
    If condition Then
        IIf = trueVal
    Else
        IIf = falseVal
    End If
End Function

Function BoolToJSON(boolVal)
    If boolVal Then
        BoolToJSON = "true"
    Else
        BoolToJSON = "false"
    End If
End Function

Function ExtractNumbers(str)
    ' Extrahiert nur die Zahlen aus einem String (z.B. "A-7063" -> "7063")
    Dim i, c, result
    result = ""
    If IsNull(str) Or str = "" Then
        ExtractNumbers = ""
        Exit Function
    End If
    For i = 1 To Len(str)
        c = Mid(str, i, 1)
        If c >= "0" And c <= "9" Then
            result = result & c
        End If
    Next
    ExtractNumbers = result
End Function

Sub CleanOldBackups(folderPath, keepCount)
    ' Löscht alte Backup-Dateien, behält nur die neuesten 'keepCount'
    Dim fso, folder, file, arrFiles, i, j, temp
    Set fso = CreateObject("Scripting.FileSystemObject")

    If Not fso.FolderExists(folderPath) Then Exit Sub

    Set folder = fso.GetFolder(folderPath)

    ' Alle Backup-Dateien sammeln
    ReDim arrFiles(0)
    Dim fileCount
    fileCount = 0

    For Each file In folder.Files
        If InStr(1, file.Name, "buchungen_backup_", vbTextCompare) > 0 And _
           LCase(fso.GetExtensionName(file.Name)) = "json" Then
            If fileCount = 0 Then
                ReDim arrFiles(0)
            Else
                ReDim Preserve arrFiles(fileCount)
            End If
            Set arrFiles(fileCount) = file
            fileCount = fileCount + 1
        End If
    Next

    ' Wenn weniger als keepCount, nichts löschen
    If fileCount <= keepCount Then Exit Sub

    ' Nach Datum sortieren (neueste zuerst) - Bubble Sort
    For i = 0 To fileCount - 2
        For j = i + 1 To fileCount - 1
            If arrFiles(i).DateLastModified < arrFiles(j).DateLastModified Then
                Set temp = arrFiles(i)
                Set arrFiles(i) = arrFiles(j)
                Set arrFiles(j) = temp
            End If
        Next
    Next

    ' Alte Dateien löschen (nach keepCount)
    For i = keepCount To fileCount - 1
        arrFiles(i).Delete
    Next
End Sub

' ============================================
' JAHRESARCHIV-FUNKTION
' ============================================
Sub ArchiveYear(yearToArchive, dataPath)
    ' Archiviert alle Buchungen eines Jahres in separate Datei
    ' Wird manuell aufgerufen oder am Jahresende
    Dim fso, strBuchungenPath, strArchivePath
    Set fso = CreateObject("Scripting.FileSystemObject")

    strBuchungenPath = dataPath & "\buchungen.json"
    strArchivePath = dataPath & "\buchungen_" & yearToArchive & ".json"

    ' Aktuelle Datei als Jahresarchiv speichern
    If fso.FileExists(strBuchungenPath) Then
        fso.CopyFile strBuchungenPath, strArchivePath
    End If
End Sub

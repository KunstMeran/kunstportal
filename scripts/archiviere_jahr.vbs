' ============================================
' Jahresarchiv-Skript für Projektsoftware Kunst Meran
' Version: 1.0.0
' ============================================
'
' Dieses Skript:
' 1. Fragt welches Jahr archiviert werden soll
' 2. Kopiert buchungen.json zu buchungen_JAHR.json
' 3. Exportiert auch die localStorage-Daten (Status)
'
' Ausführung: Doppelklick auf diese Datei am Jahresende
' ============================================

Option Explicit

Dim objFSO, strScriptPath, strBasePath, strDataPath
Dim strYear, strBuchungenPath, strArchivePath
Dim strStatusExportPath

' FileSystemObject erstellen
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Pfade ermitteln
strScriptPath = objFSO.GetParentFolderName(WScript.ScriptFullName)
strBasePath = objFSO.GetParentFolderName(strScriptPath)
strDataPath = strBasePath & "\data"

' Prüfen ob data-Ordner existiert
If Not objFSO.FolderExists(strDataPath) Then
    MsgBox "Data-Ordner nicht gefunden:" & vbCrLf & strDataPath, vbCritical, "Fehler"
    WScript.Quit
End If

' Jahr abfragen
strYear = InputBox("Welches Jahr soll archiviert werden?" & vbCrLf & vbCrLf & _
                   "WICHTIG: Das Archiv enthält alle Buchungen die zum Zeitpunkt" & vbCrLf & _
                   "der Archivierung in buchungen.json sind." & vbCrLf & vbCrLf & _
                   "Nach der Archivierung können Sie für das neue Jahr" & vbCrLf & _
                   "einen frischen DATEV-Export mit nur den neuen Daten importieren.", _
                   "Jahr archivieren", Year(Now) - 1)

If strYear = "" Then
    MsgBox "Archivierung abgebrochen.", vbInformation, "Abgebrochen"
    WScript.Quit
End If

' Prüfen ob gültiges Jahr
If Not IsNumeric(strYear) Or Len(strYear) <> 4 Then
    MsgBox "Ungültiges Jahr eingegeben: " & strYear, vbCritical, "Fehler"
    WScript.Quit
End If

strBuchungenPath = strDataPath & "\buchungen.json"
strArchivePath = strDataPath & "\buchungen_" & strYear & ".json"

' Prüfen ob buchungen.json existiert
If Not objFSO.FileExists(strBuchungenPath) Then
    MsgBox "Keine buchungen.json gefunden!" & vbCrLf & _
           "Bitte zuerst einen DATEV-Import durchführen.", vbCritical, "Fehler"
    WScript.Quit
End If

' Prüfen ob Archiv bereits existiert
If objFSO.FileExists(strArchivePath) Then
    Dim result
    result = MsgBox("Archiv für " & strYear & " existiert bereits!" & vbCrLf & vbCrLf & _
                    "Möchten Sie es überschreiben?", vbYesNo + vbQuestion, "Archiv überschreiben?")
    If result = vbNo Then
        MsgBox "Archivierung abgebrochen.", vbInformation, "Abgebrochen"
        WScript.Quit
    End If
End If

' Archiv erstellen
objFSO.CopyFile strBuchungenPath, strArchivePath, True

' Erfolgsmeldung
MsgBox "Jahresarchiv erfolgreich erstellt!" & vbCrLf & vbCrLf & _
       "Archiv-Datei: buchungen_" & strYear & ".json" & vbCrLf & vbCrLf & _
       "WICHTIG: Statusdaten (kontrolliert, bezahlt, Kostentyp, etc.)" & vbCrLf & _
       "sind im Browser gespeichert und bleiben erhalten." & vbCrLf & vbCrLf & _
       "Nächste Schritte:" & vbCrLf & _
       "1. Für das neue Jahr nur das neue Jahr aus DATEV exportieren" & vbCrLf & _
       "2. Den neuen Export in 'DATEV Exporte' speichern" & vbCrLf & _
       "3. import_datev.vbs ausführen" & vbCrLf & vbCrLf & _
       "Um alte Jahre anzusehen:" & vbCrLf & _
       "Im Portal können Sie zwischen Jahren wechseln.", _
       vbInformation, "Archivierung abgeschlossen"

' Aufräumen
Set objFSO = Nothing

WScript.Quit

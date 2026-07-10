' ============================================
' DECKUNGSBEITRAGSRECHNUNG - BEISPIEL ERSTELLEN
' Erstellt eine formatierte Excel-Datei als Vorlage
' ============================================

Option Explicit

Dim excel, wb, ws, wsErklaerung
Dim scriptPath, outputPath
Dim row

' Pfad ermitteln
scriptPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
outputPath = scriptPath & "\..\data\DB-Rechnung_Beispiel_2026.xlsx"

' Excel starten
Set excel = CreateObject("Excel.Application")
excel.Visible = False
excel.DisplayAlerts = False

' Neue Arbeitsmappe
Set wb = excel.Workbooks.Add
Set ws = wb.Worksheets(1)
ws.Name = "DB-Rechnung"

' Zweites Sheet fuer Erklaerung
Set wsErklaerung = wb.Worksheets.Add
wsErklaerung.Name = "Erklaerung"
wsErklaerung.Move After:=ws

' ==========================================
' HEADER
' ==========================================
ws.Cells(1, 1).Value = "DECKUNGSBEITRAGSRECHNUNG"
ws.Cells(1, 1).Font.Size = 16
ws.Cells(1, 1).Font.Bold = True
ws.Range("A1:G1").Merge

ws.Cells(2, 1).Value = "Kunst Meran - Vorschlag Controlling"
ws.Cells(2, 1).Font.Size = 12
ws.Cells(2, 1).Font.Italic = True
ws.Range("A2:G2").Merge

ws.Cells(3, 1).Value = "Stand: " & FormatDateTime(Now, 2)
ws.Range("A3:G3").Merge

' ==========================================
' SPALTENÜBERSCHRIFTEN
' ==========================================
row = 5
ws.Cells(row, 1).Value = "Position"
ws.Cells(row, 2).Value = "Konto"
ws.Cells(row, 3).Value = "YTD IST"
ws.Cells(row, 4).Value = "YTD SOLL"
ws.Cells(row, 5).Value = "Abweichung"
ws.Cells(row, 6).Value = "Abw. %"
ws.Cells(row, 7).Value = "Jahr BUDGET"

' Header formatieren
ws.Range("A5:G5").Font.Bold = True
ws.Range("A5:G5").Interior.Color = RGB(51, 51, 51)
ws.Range("A5:G5").Font.Color = RGB(255, 255, 255)
ws.Range("C5:G5").HorizontalAlignment = -4152 ' xlRight

' ==========================================
' 1. UMSÄTZE
' ==========================================
row = 7
ws.Cells(row, 1).Value = "1. UMSÄTZE"
ws.Cells(row, 1).Font.Bold = True
ws.Range("A" & row & ":G" & row).Interior.Color = RGB(230, 230, 230)

row = 8
AddDetailRow ws, row, "   Erlöse Shop", "6001*", 25800, 32167, 38752
row = 9
AddDetailRow ws, row, "   Erlöse Verpachtung Bar", "60010101550", 24200, 30333, 36400
row = 10
AddDetailRow ws, row, "   Erlöse Ausstellungen", "600151051", 10800, 13540, 16248
row = 11
AddDetailRow ws, row, "   Erlöse Werbetätigkeit", "600151053", 43300, 54165, 64998
row = 12
AddDetailRow ws, row, "   Erlöse Bildung/Vermittlung", "600151055", 885, 1106, 1327

row = 13
ws.Cells(row, 1).Value = "1.1 Erlöse Lieferungen/Leistungen"
ws.Cells(row, 1).Font.Bold = True
ws.Cells(row, 2).Value = "6001*"
ws.Cells(row, 3).Formula = "=SUM(C8:C12)"
ws.Cells(row, 4).Formula = "=SUM(D8:D12)"
ws.Cells(row, 5).Formula = "=C13-D13"
ws.Cells(row, 6).Formula = "=IF(D13=0,0,(C13-D13)/D13)"
ws.Cells(row, 7).Formula = "=SUM(G8:G12)"
FormatSumRow ws, row

row = 15
AddDetailRow ws, row, "   Mitgliedsbeiträge", "6401550", 9000, 11250, 13500
row = 16
AddDetailRow ws, row, "   Spenden", "6401551", 7900, 9917, 11900
row = 17
AddDetailRow ws, row, "   Beitrag Gemeinde Meran", "6401552", 68400, 85500, 102600
row = 18
AddDetailRow ws, row, "   Beitrag Provinz Bozen", "6401554", 236659, 295824, 354989
row = 19
AddDetailRow ws, row, "   Beitrag Region", "6401556", 12000, 15000, 18000
row = 20
AddDetailRow ws, row, "   Beiträge Stiftung Sparkasse", "6401557", 60000, 75000, 90000
row = 21
AddDetailRow ws, row, "   Sponsoring (Firmen)", "6401557", 15000, 37500, 45000
row = 22
AddDetailRow ws, row, "   Öffentl. Beiträge Biennale", "6401565", 170000, 212500, 255000

row = 23
ws.Cells(row, 1).Value = "1.2 Zuschüsse und Beiträge"
ws.Cells(row, 1).Font.Bold = True
ws.Cells(row, 2).Value = "6401*"
ws.Cells(row, 3).Formula = "=SUM(C15:C22)"
ws.Cells(row, 4).Formula = "=SUM(D15:D22)"
ws.Cells(row, 5).Formula = "=C23-D23"
ws.Cells(row, 6).Formula = "=IF(D23=0,0,(C23-D23)/D23)"
ws.Cells(row, 7).Formula = "=SUM(G15:G22)"
FormatSumRow ws, row

row = 25
AddDetailRow ws, row, "   Investitionsbeiträge", "6401751", 49050, 61314, 73577
row = 26
AddDetailRow ws, row, "   5 Promille Zuweisung", "6401260", 0, 2545, 3054
row = 27
AddDetailRow ws, row, "   Sonstige Erträge", "6400*", 5000, 7283, 8740

row = 28
ws.Cells(row, 1).Value = "1.3 Sonstige betriebliche Erträge"
ws.Cells(row, 1).Font.Bold = True
ws.Cells(row, 2).Value = "6400*"
ws.Cells(row, 3).Formula = "=SUM(C25:C27)"
ws.Cells(row, 4).Formula = "=SUM(D25:D27)"
ws.Cells(row, 5).Formula = "=C28-D28"
ws.Cells(row, 6).Formula = "=IF(D28=0,0,(C28-D28)/D28)"
ws.Cells(row, 7).Formula = "=SUM(G25:G27)"
FormatSumRow ws, row

' SUMME UMSÄTZE
row = 30
ws.Cells(row, 1).Value = "SUMME UMSÄTZE"
ws.Cells(row, 1).Font.Bold = True
ws.Cells(row, 3).Formula = "=C13+C23+C28"
ws.Cells(row, 4).Formula = "=D13+D23+D28"
ws.Cells(row, 5).Formula = "=C30-D30"
ws.Cells(row, 6).Formula = "=IF(D30=0,0,(C30-D30)/D30)"
ws.Cells(row, 7).Formula = "=G13+G23+G28"
ws.Range("A" & row & ":G" & row).Interior.Color = RGB(200, 230, 200)
ws.Range("A" & row & ":G" & row).Font.Bold = True
FormatNumberCells ws, row

' ==========================================
' 2. DIREKTE KOSTEN
' ==========================================
row = 32
ws.Cells(row, 1).Value = "2. DIREKTE KOSTEN"
ws.Cells(row, 1).Font.Bold = True
ws.Range("A" & row & ":G" & row).Interior.Color = RGB(230, 230, 230)

row = 33
AddDetailRow ws, row, "   Zukauf Ausstellung", "6800750", 22100, 27625, 33150
row = 34
AddDetailRow ws, row, "   Einkauf Verbrauchsmaterial", "680201010", 980, 1224, 1469
row = 35
AddDetailRow ws, row, "   Büromaterial", "680202530", 3070, 3838, 4605
row = 36
AddDetailRow ws, row, "   Zukauf Shop", "6802510", 51440, 64300, 77160

row = 37
ws.Cells(row, 1).Value = "(a) Materialkosten"
ws.Cells(row, 1).Font.Bold = True
ws.Cells(row, 2).Value = "680*"
ws.Cells(row, 3).Formula = "=SUM(C33:C36)"
ws.Cells(row, 4).Formula = "=SUM(D33:D36)"
ws.Cells(row, 5).Formula = "=C37-D37"
ws.Cells(row, 6).Formula = "=IF(D37=0,0,(C37-D37)/D37)"
ws.Cells(row, 7).Formula = "=SUM(G33:G36)"
FormatSumRow ws, row

row = 39
AddDetailRow ws, row, "   Dienstleistung Ausstellung", "6901251", 300678, 375848, 451018
row = 40
AddDetailRow ws, row, "   Dienstleistung Kataloge", "6901252", 46436, 58045, 69654
row = 41
AddDetailRow ws, row, "   Dienstleistung Projekte", "6901253", 91302, 114128, 136954
row = 42
AddDetailRow ws, row, "   DL Projekte Venedig", "6901257", 328006, 410008, 492010
row = 43
AddDetailRow ws, row, "   Reisekosten Künstler", "6903312", 26858, 33573, 40288
row = 44
AddDetailRow ws, row, "   Unterkunft Künstler", "6903316", 26337, 32921, 39505

row = 45
ws.Cells(row, 1).Value = "(b) Dienstleistungen (Ausst./Projekte)"
ws.Cells(row, 1).Font.Bold = True
ws.Cells(row, 2).Value = "690125*"
ws.Cells(row, 3).Formula = "=SUM(C39:C44)"
ws.Cells(row, 4).Formula = "=SUM(D39:D44)"
ws.Cells(row, 5).Formula = "=C45-D45"
ws.Cells(row, 6).Formula = "=IF(D45=0,0,(C45-D45)/D45)"
ws.Cells(row, 7).Formula = "=SUM(G39:G44)"
FormatSumRow ws, row

' SUMME DIREKTE KOSTEN
row = 47
ws.Cells(row, 1).Value = "SUMME DIREKTE KOSTEN"
ws.Cells(row, 1).Font.Bold = True
ws.Cells(row, 3).Formula = "=C37+C45"
ws.Cells(row, 4).Formula = "=D37+D45"
ws.Cells(row, 5).Formula = "=C47-D47"
ws.Cells(row, 6).Formula = "=IF(D47=0,0,(C47-D47)/D47)"
ws.Cells(row, 7).Formula = "=G37+G45"
ws.Range("A" & row & ":G" & row).Interior.Color = RGB(255, 200, 200)
ws.Range("A" & row & ":G" & row).Font.Bold = True
FormatNumberCells ws, row

' ==========================================
' DECKUNGSBEITRAG 1
' ==========================================
row = 49
ws.Cells(row, 1).Value = "3. DECKUNGSBEITRAG 1 (DB1)"
ws.Cells(row, 1).Font.Bold = True
ws.Cells(row, 1).Font.Size = 12
ws.Cells(row, 3).Formula = "=C30-C47"
ws.Cells(row, 4).Formula = "=D30-D47"
ws.Cells(row, 5).Formula = "=C49-D49"
ws.Cells(row, 6).Formula = "=IF(D49=0,0,(C49-D49)/D49)"
ws.Cells(row, 7).Formula = "=G30-G47"
ws.Range("A" & row & ":G" & row).Interior.Color = RGB(200, 220, 255)
ws.Range("A" & row & ":G" & row).Font.Bold = True
FormatNumberCells ws, row

row = 50
ws.Cells(row, 1).Value = "   DB1-Marge (in % der Umsätze)"
ws.Cells(row, 3).Formula = "=IF(C30=0,0,C49/C30)"
ws.Cells(row, 4).Formula = "=IF(D30=0,0,D49/D30)"
ws.Cells(row, 7).Formula = "=IF(G30=0,0,G49/G30)"
ws.Range("C50:D50").NumberFormat = "0.0%"
ws.Range("G50").NumberFormat = "0.0%"
ws.Cells(row, 1).Font.Italic = True

' ==========================================
' 4. STRUKTURKOSTEN
' ==========================================
row = 52
ws.Cells(row, 1).Value = "4. STRUKTURKOSTEN"
ws.Cells(row, 1).Font.Bold = True
ws.Range("A" & row & ":G" & row).Interior.Color = RGB(230, 230, 230)

row = 53
AddDetailRow ws, row, "   Sonstige Dienstleistungen", "6901201", 9264, 11580, 13896
row = 54
AddDetailRow ws, row, "   Betriebl. Aufwendungen", "6901230", 54902, 68628, 82354
row = 55
AddDetailRow ws, row, "   Honorare Vermittler", "690181520", 25740, 32175, 38609
row = 56
AddDetailRow ws, row, "   Steuer-/Wirtschaftsberatung", "690182025", 11422, 14278, 17134
row = 57
AddDetailRow ws, row, "   Verwaltung/Lohnspesen", "690182037", 50856, 63571, 76285

row = 58
ws.Cells(row, 1).Value = "(a) Verwaltung"
ws.Cells(row, 1).Font.Bold = True
ws.Cells(row, 2).Value = "6901/02*"
ws.Cells(row, 3).Formula = "=SUM(C53:C57)"
ws.Cells(row, 4).Formula = "=SUM(D53:D57)"
ws.Cells(row, 5).Formula = "=C58-D58"
ws.Cells(row, 6).Formula = "=IF(D58=0,0,(C58-D58)/D58)"
ws.Cells(row, 7).Formula = "=SUM(G53:G57)"
FormatSumRow ws, row

row = 60
AddDetailRow ws, row, "   Miete Café Kunsthaus", "7001010", 60000, 75000, 90000
row = 61
AddDetailRow ws, row, "   Miete Ausstellungsbereich", "7001052", 80268, 100335, 120402
row = 62
AddDetailRow ws, row, "   Miete Büro", "7001053", 16200, 20250, 24300
row = 63
AddDetailRow ws, row, "   Miete Biennale Venedig", "7001055", 180000, 225000, 270000
row = 64
AddDetailRow ws, row, "   Software", "7004030", 9646, 12058, 14469

row = 65
ws.Cells(row, 1).Value = "(b) Strukturen (inkl. Miete)"
ws.Cells(row, 1).Font.Bold = True
ws.Cells(row, 2).Value = "700*"
ws.Cells(row, 3).Formula = "=SUM(C60:C64)"
ws.Cells(row, 4).Formula = "=SUM(D60:D64)"
ws.Cells(row, 5).Formula = "=C65-D65"
ws.Cells(row, 6).Formula = "=IF(D65=0,0,(C65-D65)/D65)"
ws.Cells(row, 7).Formula = "=SUM(G60:G64)"
FormatSumRow ws, row

row = 67
AddDetailRow ws, row, "   Strom", "690241003", 23876, 29845, 35813
row = 68
AddDetailRow ws, row, "   Telefon/Internet", "690241006", 5238, 6548, 7858
row = 69
AddDetailRow ws, row, "   Versicherungen", "690241524", 12928, 16160, 19392
row = 70
AddDetailRow ws, row, "   Reinigungsdienste", "690242010", 17918, 22398, 26877

row = 71
ws.Cells(row, 1).Value = "(c) Gebäudekosten"
ws.Cells(row, 1).Font.Bold = True
ws.Cells(row, 2).Value = "690241/42*"
ws.Cells(row, 3).Formula = "=SUM(C67:C70)"
ws.Cells(row, 4).Formula = "=SUM(D67:D70)"
ws.Cells(row, 5).Formula = "=C71-D71"
ws.Cells(row, 6).Formula = "=IF(D71=0,0,(C71-D71)/D71)"
ws.Cells(row, 7).Formula = "=SUM(G67:G70)"
FormatSumRow ws, row

row = 73
AddDetailRow ws, row, "   Personalspesen (Gehälter)", "7101010", 437438, 546797, 656156
row = 74
AddDetailRow ws, row, "   Sozialabgaben", "7101510", 114996, 143745, 172494
row = 75
AddDetailRow ws, row, "   Abfertigungsfond", "7102010", 30100, 37625, 45149
row = 76
AddDetailRow ws, row, "   Essenmarken", "6902725", 12388, 15485, 18582

row = 77
ws.Cells(row, 1).Value = "(d) Personalkosten"
ws.Cells(row, 1).Font.Bold = True
ws.Cells(row, 2).Value = "710*"
ws.Cells(row, 3).Formula = "=SUM(C73:C76)"
ws.Cells(row, 4).Formula = "=SUM(D73:D76)"
ws.Cells(row, 5).Formula = "=C77-D77"
ws.Cells(row, 6).Formula = "=IF(D77=0,0,(C77-D77)/D77)"
ws.Cells(row, 7).Formula = "=SUM(G73:G76)"
FormatSumRow ws, row

' SUMME STRUKTURKOSTEN
row = 79
ws.Cells(row, 1).Value = "SUMME STRUKTURKOSTEN"
ws.Cells(row, 1).Font.Bold = True
ws.Cells(row, 3).Formula = "=C58+C65+C71+C77"
ws.Cells(row, 4).Formula = "=D58+D65+D71+D77"
ws.Cells(row, 5).Formula = "=C79-D79"
ws.Cells(row, 6).Formula = "=IF(D79=0,0,(C79-D79)/D79)"
ws.Cells(row, 7).Formula = "=G58+G65+G71+G77"
ws.Range("A" & row & ":G" & row).Interior.Color = RGB(255, 200, 200)
ws.Range("A" & row & ":G" & row).Font.Bold = True
FormatNumberCells ws, row

' ==========================================
' DECKUNGSBEITRAG 2 / EBITDA
' ==========================================
row = 81
ws.Cells(row, 1).Value = "5. DECKUNGSBEITRAG 2 / EBITDA"
ws.Cells(row, 1).Font.Bold = True
ws.Cells(row, 1).Font.Size = 12
ws.Cells(row, 3).Formula = "=C49-C79"
ws.Cells(row, 4).Formula = "=D49-D79"
ws.Cells(row, 5).Formula = "=C81-D81"
ws.Cells(row, 6).Formula = "=IF(D81=0,0,(C81-D81)/D81)"
ws.Cells(row, 7).Formula = "=G49-G79"
ws.Range("A" & row & ":G" & row).Interior.Color = RGB(200, 220, 255)
ws.Range("A" & row & ":G" & row).Font.Bold = True
FormatNumberCells ws, row

row = 82
ws.Cells(row, 1).Value = "   EBITDA-Marge (in % der Umsätze)"
ws.Cells(row, 3).Formula = "=IF(C30=0,0,C81/C30)"
ws.Cells(row, 4).Formula = "=IF(D30=0,0,D81/D30)"
ws.Cells(row, 7).Formula = "=IF(G30=0,0,G81/G30)"
ws.Range("C82:D82").NumberFormat = "0.0%"
ws.Range("G82").NumberFormat = "0.0%"
ws.Cells(row, 1).Font.Italic = True

' ==========================================
' ABSCHREIBUNGEN & ZINSEN
' ==========================================
row = 84
AddDetailRow ws, row, "6. Abschreibungen (kalk.)", "720*", 29108, 36385, 43663
row = 85
AddDetailRow ws, row, "7. Zinsen", "850*", 19118, 23898, 28685

' ==========================================
' ERGEBNIS
' ==========================================
row = 87
ws.Cells(row, 1).Value = "8. ERGEBNIS"
ws.Cells(row, 1).Font.Bold = True
ws.Cells(row, 1).Font.Size = 14
ws.Cells(row, 3).Formula = "=C81-C84-C85"
ws.Cells(row, 4).Formula = "=D81-D84-D85"
ws.Cells(row, 5).Formula = "=C87-D87"
ws.Cells(row, 6).Formula = "=IF(D87=0,0,(C87-D87)/D87)"
ws.Cells(row, 7).Formula = "=G81-G84-G85"
ws.Range("A" & row & ":G" & row).Interior.Color = RGB(255, 255, 150)
ws.Range("A" & row & ":G" & row).Font.Bold = True
ws.Range("A" & row & ":G" & row).Font.Size = 12
FormatNumberCells ws, row

' ==========================================
' LEGENDE (kurz auf Hauptsheet)
' ==========================================
row = 90
ws.Cells(row, 1).Value = "Siehe Sheet 'Erklaerung' fuer Details zu DB1, DB2 und allen Positionen"
ws.Cells(row, 1).Font.Italic = True
ws.Cells(row, 1).Font.Color = RGB(0, 0, 200)

' ==========================================
' ERKLAERUNGSSHEET
' ==========================================
row = 1
wsErklaerung.Cells(row, 1).Value = "ERKLAERUNG DECKUNGSBEITRAGSRECHNUNG"
wsErklaerung.Cells(row, 1).Font.Size = 18
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Range("A1:E1").Merge

row = 2
wsErklaerung.Cells(row, 1).Value = "Kunst Meran - Controlling"
wsErklaerung.Cells(row, 1).Font.Size = 12
wsErklaerung.Range("A2:E2").Merge

' Spaltenerklaerungen
row = 5
wsErklaerung.Cells(row, 1).Value = "SPALTENERKLAERUNG"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 1).Font.Size = 14
wsErklaerung.Range("A" & row & ":E" & row).Interior.Color = RGB(200, 200, 200)

row = 7
wsErklaerung.Cells(row, 1).Value = "YTD IST"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 2).Value = "Jahr bis dato - tatsaechlich angefallene/eingegangene Betraege"
wsErklaerung.Range("B7:E7").Merge

row = 8
wsErklaerung.Cells(row, 1).Value = "YTD SOLL"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 2).Value = "Jahr bis dato - geplante Betraege (anteilig auf Monate verteilt, z.B. 5/12 des Jahresbudgets im Mai)"
wsErklaerung.Range("B8:E8").Merge

row = 9
wsErklaerung.Cells(row, 1).Value = "Abweichung"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 2).Value = "Differenz IST zu SOLL. Bei Umsaetzen: positiv = besser. Bei Kosten: negativ = besser (weniger ausgegeben)"
wsErklaerung.Range("B9:E9").Merge

row = 10
wsErklaerung.Cells(row, 1).Value = "Abw. %"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 2).Value = "Prozentuale Abweichung vom SOLL"
wsErklaerung.Range("B10:E10").Merge

row = 11
wsErklaerung.Cells(row, 1).Value = "Jahr BUDGET"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 2).Value = "Geplantes Gesamtbudget fuer das komplette Jahr"
wsErklaerung.Range("B11:E11").Merge

' DB1 Erklaerung
row = 14
wsErklaerung.Cells(row, 1).Value = "DECKUNGSBEITRAG 1 (DB1)"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 1).Font.Size = 14
wsErklaerung.Range("A" & row & ":E" & row).Interior.Color = RGB(200, 220, 255)

row = 16
wsErklaerung.Cells(row, 1).Value = "Formel:"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 2).Value = "DB1 = UMSAETZE - DIREKTE KOSTEN"
wsErklaerung.Cells(row, 2).Font.Bold = True

row = 18
wsErklaerung.Cells(row, 1).Value = "Was zeigt DB1?"
wsErklaerung.Cells(row, 1).Font.Bold = True
row = 19
wsErklaerung.Cells(row, 1).Value = "Der DB1 zeigt, wie profitabel die KERNAKTIVITAETEN des Kunsthauses sind."
row = 20
wsErklaerung.Cells(row, 1).Value = "Er beantwortet die Frage: Decken die Einnahmen die direkten Projektkosten?"
row = 22
wsErklaerung.Cells(row, 1).Value = "Direkte Kosten sind:"
wsErklaerung.Cells(row, 1).Font.Bold = True
row = 23
wsErklaerung.Cells(row, 1).Value = "  - Materialkosten (Zukauf Ausstellung, Shop-Waren, Verbrauchsmaterial)"
row = 24
wsErklaerung.Cells(row, 1).Value = "  - Dienstleistungen fuer Ausstellungen und Projekte"
row = 25
wsErklaerung.Cells(row, 1).Value = "  - Kuenstlerkosten (Reisen, Unterkunft, Honorare)"
row = 26
wsErklaerung.Cells(row, 1).Value = "  - Kataloge und Publikationen"
row = 28
wsErklaerung.Cells(row, 1).Value = "DB1-Marge:"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 2).Value = "DB1 / Umsaetze * 100 = Prozentsatz der Umsaetze, der nach Abzug der direkten Kosten uebrig bleibt"
wsErklaerung.Range("B28:E28").Merge

row = 30
wsErklaerung.Cells(row, 1).Value = "Interpretation:"
wsErklaerung.Cells(row, 1).Font.Bold = True
row = 31
wsErklaerung.Cells(row, 1).Value = "  DB1-Marge > 50%: Sehr gut - die Projektkosten sind gut gedeckt"
wsErklaerung.Cells(row, 1).Font.Color = RGB(0, 128, 0)
row = 32
wsErklaerung.Cells(row, 1).Value = "  DB1-Marge 30-50%: OK - aber wenig Spielraum fuer Strukturkosten"
wsErklaerung.Cells(row, 1).Font.Color = RGB(200, 150, 0)
row = 33
wsErklaerung.Cells(row, 1).Value = "  DB1-Marge < 30%: Kritisch - die Projekte 'fressen' fast alle Einnahmen"
wsErklaerung.Cells(row, 1).Font.Color = RGB(200, 0, 0)

' DB2 Erklaerung
row = 36
wsErklaerung.Cells(row, 1).Value = "DECKUNGSBEITRAG 2 / EBITDA"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 1).Font.Size = 14
wsErklaerung.Range("A" & row & ":E" & row).Interior.Color = RGB(200, 220, 255)

row = 38
wsErklaerung.Cells(row, 1).Value = "Formel:"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 2).Value = "DB2 = DB1 - STRUKTURKOSTEN"
wsErklaerung.Cells(row, 2).Font.Bold = True

row = 40
wsErklaerung.Cells(row, 1).Value = "Was zeigt DB2/EBITDA?"
wsErklaerung.Cells(row, 1).Font.Bold = True
row = 41
wsErklaerung.Cells(row, 1).Value = "Der DB2 zeigt das OPERATIVE ERGEBNIS vor Abschreibungen und Zinsen."
row = 42
wsErklaerung.Cells(row, 1).Value = "EBITDA = Earnings Before Interest, Taxes, Depreciation and Amortization"
row = 43
wsErklaerung.Cells(row, 1).Value = "Er zeigt: Kann sich das Kunsthaus 'selbst tragen' im laufenden Betrieb?"
row = 45
wsErklaerung.Cells(row, 1).Value = "Strukturkosten sind:"
wsErklaerung.Cells(row, 1).Font.Bold = True
row = 46
wsErklaerung.Cells(row, 1).Value = "  - Verwaltung (Steuerberater, Buchhaltung, allg. Dienstleistungen)"
row = 47
wsErklaerung.Cells(row, 1).Value = "  - Mieten (Buero, Ausstellungsflaeche, Cafe, Biennale Venedig)"
row = 48
wsErklaerung.Cells(row, 1).Value = "  - Gebaeudekosten (Strom, Wasser, Telefon, Versicherung, Reinigung)"
row = 49
wsErklaerung.Cells(row, 1).Value = "  - Personalkosten (Gehaelter, Sozialabgaben, Essenmarken)"
row = 51
wsErklaerung.Cells(row, 1).Value = "EBITDA-Marge:"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 2).Value = "DB2 / Umsaetze * 100 = Operative Profitabilitaet"
wsErklaerung.Range("B51:E51").Merge

row = 53
wsErklaerung.Cells(row, 1).Value = "Interpretation:"
wsErklaerung.Cells(row, 1).Font.Bold = True
row = 54
wsErklaerung.Cells(row, 1).Value = "  EBITDA > 0: Das Kunsthaus erwirtschaftet einen operativen Ueberschuss"
wsErklaerung.Cells(row, 1).Font.Color = RGB(0, 128, 0)
row = 55
wsErklaerung.Cells(row, 1).Value = "  EBITDA = 0: Einnahmen und laufende Kosten sind ausgeglichen"
wsErklaerung.Cells(row, 1).Font.Color = RGB(200, 150, 0)
row = 56
wsErklaerung.Cells(row, 1).Value = "  EBITDA < 0: Das Kunsthaus macht operativen Verlust - Zuschuss-Abhaengigkeit!"
wsErklaerung.Cells(row, 1).Font.Color = RGB(200, 0, 0)

' Ergebnis Erklaerung
row = 59
wsErklaerung.Cells(row, 1).Value = "ERGEBNIS"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 1).Font.Size = 14
wsErklaerung.Range("A" & row & ":E" & row).Interior.Color = RGB(255, 255, 150)

row = 61
wsErklaerung.Cells(row, 1).Value = "Formel:"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 2).Value = "ERGEBNIS = EBITDA - Abschreibungen - Zinsen"
wsErklaerung.Cells(row, 2).Font.Bold = True

row = 63
wsErklaerung.Cells(row, 1).Value = "Was zeigt das Ergebnis?"
wsErklaerung.Cells(row, 1).Font.Bold = True
row = 64
wsErklaerung.Cells(row, 1).Value = "Das Endergebnis nach ALLEN Kosten inkl. Abschreibungen und Zinsen."
row = 65
wsErklaerung.Cells(row, 1).Value = "Abschreibungen sind 'nicht-cash' Kosten fuer Wertverlust von Anlagen."
row = 66
wsErklaerung.Cells(row, 1).Value = "Zinsen sind Finanzierungskosten (Bankkredit, etc.)"
row = 68
wsErklaerung.Cells(row, 1).Value = "Fuer Kultureinrichtungen:"
wsErklaerung.Cells(row, 1).Font.Bold = True
row = 69
wsErklaerung.Cells(row, 1).Value = "Ein leicht negatives Ergebnis ist NORMAL, solange die Zuschussfinanzierung gesichert ist."
row = 70
wsErklaerung.Cells(row, 1).Value = "Wichtiger ist: Sind die Zuschussgeber zufrieden? Wird die kulturelle Mission erfuellt?"

' Wichtige Kennzahlen
row = 73
wsErklaerung.Cells(row, 1).Value = "WICHTIGE KENNZAHLEN FUER DEN VORSTAND"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 1).Font.Size = 14
wsErklaerung.Range("A" & row & ":E" & row).Interior.Color = RGB(200, 200, 200)

row = 75
wsErklaerung.Cells(row, 1).Value = "1. DB1-Marge"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 2).Value = "Wie effizient setzen wir die Mittel fuer Projekte ein?"

row = 76
wsErklaerung.Cells(row, 1).Value = "2. Strukturkostenquote"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 2).Value = "Strukturkosten / Umsaetze - wie viel 'Overhead' haben wir?"

row = 77
wsErklaerung.Cells(row, 1).Value = "3. Zuschussquote"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 2).Value = "Zueschuesse / Gesamtumsaetze - wie abhaengig sind wir von oeffentlichen Mitteln?"

row = 78
wsErklaerung.Cells(row, 1).Value = "4. YTD vs Budget"
wsErklaerung.Cells(row, 1).Font.Bold = True
wsErklaerung.Cells(row, 2).Value = "Liegen wir im Plan? Muessen wir gegensteuern?"

' Spaltenbreiten Erklaerungssheet
wsErklaerung.Columns(1).ColumnWidth = 25
wsErklaerung.Columns(2).ColumnWidth = 80
wsErklaerung.Columns(3).ColumnWidth = 15
wsErklaerung.Columns(4).ColumnWidth = 15
wsErklaerung.Columns(5).ColumnWidth = 15

' ==========================================
' FORMATIERUNG
' ==========================================

' Spaltenbreiten
ws.Columns(1).ColumnWidth = 40
ws.Columns(2).ColumnWidth = 14
ws.Columns(3).ColumnWidth = 14
ws.Columns(4).ColumnWidth = 14
ws.Columns(5).ColumnWidth = 14
ws.Columns(6).ColumnWidth = 10
ws.Columns(7).ColumnWidth = 14

' Rahmen
ws.Range("A5:G87").Borders.LineStyle = 1

' Abweichung-Spalte bedingte Formatierung (Rot wenn negativ bei Umsätzen, Grün wenn positiv)
' Einfache Lösung: Zahlen formatieren
ws.Range("E:E").NumberFormat = "#,##0;[Red]-#,##0"
ws.Range("F:F").NumberFormat = "0.0%;[Red]-0.0%"

' Speichern
wb.SaveAs outputPath
wb.Close
excel.Quit

Set ws = Nothing
Set wb = Nothing
Set excel = Nothing

MsgBox "Excel-Datei erstellt:" & vbCrLf & vbCrLf & outputPath, vbInformation, "DB-Rechnung Beispiel"

' ==========================================
' HILFSFUNKTIONEN
' ==========================================

Sub AddDetailRow(ws, row, label, konto, istValue, sollValue, budgetValue)
    ws.Cells(row, 1).Value = label
    ws.Cells(row, 2).Value = konto
    ws.Cells(row, 3).Value = istValue
    ws.Cells(row, 4).Value = sollValue
    ws.Cells(row, 5).Formula = "=C" & row & "-D" & row
    ws.Cells(row, 6).Formula = "=IF(D" & row & "=0,0,(C" & row & "-D" & row & ")/D" & row & ")"
    ws.Cells(row, 7).Value = budgetValue
    FormatNumberCells ws, row
End Sub

Sub FormatNumberCells(ws, row)
    ws.Range("C" & row & ":E" & row).NumberFormat = "#,##0"
    ws.Range("F" & row).NumberFormat = "0.0%"
    ws.Range("G" & row).NumberFormat = "#,##0"
    ws.Range("C" & row & ":G" & row).HorizontalAlignment = -4152 ' xlRight
End Sub

Sub FormatSumRow(ws, row)
    ws.Range("A" & row & ":G" & row).Font.Bold = True
    ws.Range("A" & row & ":G" & row).Interior.Color = RGB(240, 240, 240)
    FormatNumberCells ws, row
End Sub

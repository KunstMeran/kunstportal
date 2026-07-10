# 🚀 Quick Start: Deployment zu Supabase + Vercel

## Übersicht
Diese Anleitung hilft dir, die Projektsoftware Kunst Meran schnell auf Supabase (Datenbank) und Vercel (Hosting) zu deployen.

---

## ✅ Schritt 1: Supabase Setup (5 Minuten)

### 1. Supabase Projekt erstellen
1. Gehe zu [supabase.com](https://supabase.com) und registriere dich
2. Klicke auf **"New Project"**
3. Fülle aus:
   - **Name**: `kunstmeran-projektsoftware`
   - **Database Password**: Wähle ein sicheres Passwort (speichern!)
   - **Region**: `Europe (Frankfurt)`
4. Klicke auf **"Create new project"** (dauert ~2 Minuten)

### 2. Datenbank-Schema importieren
1. In deinem Supabase-Projekt: Klicke links auf **SQL Editor**
2. Klicke auf **"New Query"**
3. Öffne die Datei `supabase-schema.sql` aus diesem Projekt
4. Kopiere den gesamten Inhalt und füge ihn in den SQL Editor ein
5. Klicke auf **"Run"** (grüner Button) oder drücke `Ctrl+Enter`
6. ✅ Du solltest "Success. No rows returned" sehen

### 3. Ersten Benutzer erstellen
1. Klicke links auf **Authentication** → **Users**
2. Klicke auf **"Add user"** → **"Create new user"**
3. Fülle aus:
   - **Email**: `admin@kunstmeran.com`
   - **Password**: `KunstMeran2026`
   - ✅ **"Auto Confirm User"** aktivieren
4. Klicke auf **"Create user"**

### 4. API Keys kopieren
1. Klicke links auf **Project Settings** (Zahnrad-Icon)
2. Klicke auf **API**
3. Kopiere diese beiden Werte (du brauchst sie gleich):
   - **Project URL** (z.B. `https://abcdefgh.supabase.co`)
   - **anon public** key (langer String)

---

## ✅ Schritt 2: Vercel Deployment (3 Minuten)

### 1. Vercel Account erstellen
1. Gehe zu [vercel.com](https://vercel.com)
2. Klicke auf **"Sign Up"**
3. Wähle **"Continue with GitHub"**

### 2. Repository importieren
1. Klicke auf **"Add New..."** → **"Project"**
2. Unter **"Import Git Repository"** suche nach `Sophie0301/kunstmeran`
3. Klicke auf **"Import"**

### 3. Projekt konfigurieren
1. **Framework Preset**: Wähle `Other`
2. **Root Directory**: Lass leer (oder `./`)
3. **Build Command**: Lass leer
4. **Output Directory**: Lass leer (oder `./`)

### 4. Environment Variables hinzufügen
1. Scrolle zu **"Environment Variables"**
2. Füge hinzu:

   **Variable 1:**
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Deine Supabase Project URL von vorhin

   **Variable 2:**
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Dein Supabase anon public key von vorhin

3. Klicke auf **"Deploy"**

### 5. Warte auf Deployment
- Vercel baut jetzt deine App (dauert ~1-2 Minuten)
- ✅ Bei Erfolg siehst du **"Congratulations"** 🎉
- Du bekommst eine URL wie: `https://kunstmeran-xyz.vercel.app`

---

## ✅ Schritt 3: Testen

1. Öffne deine Vercel-URL
2. Logge dich ein:
   - **Email**: `admin@kunstmeran.com`
   - **Password**: `KunstMeran2026`
3. Teste die App!

---

## 🔄 Automatische Updates

Ab jetzt:
- Jeder `git push` zu `main` triggert automatisch ein neues Deployment
- Pull Requests bekommen Preview-URLs zum Testen

**Workflow:**
```bash
git add .
git commit -m "Deine Änderung"
git push origin main
```
→ Vercel deployed automatisch! 🚀

---

## 🆘 Probleme?

### "CORS Error" im Browser
→ In Supabase: **Authentication** → **URL Configuration**
→ Füge deine Vercel-URL zu **"Site URL"** hinzu

### "Row Level Security Policy Fehler"
→ Stelle sicher, dass du eingeloggt bist
→ Prüfe SQL-Schema: RLS Policies korrekt?

### Environment Variables funktionieren nicht
→ Vercel: **Settings** → **Environment Variables**
→ Nach Änderung: **Deployments** → **Redeploy**

---

## 📊 Kosten

### ✅ Komplett kostenlos für dein Projekt!

**Supabase Free Tier:**
- 500 MB Datenbank ✅
- 1 GB File Storage ✅
- 50,000 monatliche User ✅

**Vercel Free Tier:**
- 100 GB Bandwidth ✅
- Unbegrenzte Deployments ✅
- Custom Domain inklusive ✅

---

## 📚 Weitere Infos

Detaillierte Dokumentation: Siehe [DEPLOYMENT.md](DEPLOYMENT.md)

**Support:**
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs

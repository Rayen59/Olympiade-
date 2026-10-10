# 🚀 Guide de Déploiement : Render & Vercel

Cette application est un serveur complet **Node.js (Express)** avec téléversement de fichiers (PDF d'épreuves, copies manuscrites et images de solutions) et stockage local JSON.

---

## Option 1 : Déploiement sur Render (Recommandé ⭐)

Render est la plateforme idéale pour les applications Node.js / Express avec système de fichiers et uploads Multer.

### Étapes pas à pas :

1. **Créer un compte sur Render** : Rendez-vous sur [render.com](https://render.com) et connectez-vous avec votre compte GitHub.
2. **Créer un Nouveau Web Service** :
   - Cliquez sur **New +** > **Web Service**.
   - Sélectionnez votre dépôt GitHub : `Rayen59/Olympiade-`.
3. **Paramètres de configuration** :
   - **Name** : `memorial-assil-hamdi-olympiades` (ou le nom de votre choix).
   - **Environment** : `Node`.
   - **Branch** : `main` (ou votre branche principale).
   - **Build Command** : `npm install`
   - **Start Command** : `node server.js`
   - **Plan** : `Free` (Gratuit).
4. **Variables d'environnement** :
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render définit automatiquement le port).
5. **Cliquer sur "Create Web Service"** :
   - Render va cloner le code, exécuter `npm install` et lancer `node server.js`.
   - Votre application sera accessible via une URL HTTPS gratuite : `https://votre-app.onrender.com`.

---

## Option 2 : Déploiement sur Vercel

Vercel est optimisé pour le serverless. Le fichier `vercel.json` a été créé à la racine du projet pour router toutes les requêtes vers `server.js`.

### Étapes pas à pas :

1. **Créer un compte sur Vercel** : Rendez-vous sur [vercel.com](https://vercel.com) et connectez-vous avec GitHub.
2. **Importer le projet** :
   - Cliquez sur **Add New...** > **Project**.
   - Sélectionnez `Rayen59/Olympiade-`.
3. **Configuration du Build** :
   - Framework Preset : `Other`.
   - Root Directory : `./`
   - Build Command : Laisser par défaut (`npm run build`).
   - Output Directory : Laisser vide.
4. **Cliquer sur "Deploy"** :
   - Vercel convertira `server.js` en fonction Serverless via `@vercel/node`.
   - Votre URL de production sera générée : `https://votre-app.vercel.app`.

*Note pour Vercel* : L'environnement serverless de Vercel possède un système de fichiers temporaire (`/tmp`). Pour la persistance à long terme des uploads volumineux sur Vercel, un stockage cloud (AWS S3, Cloudinary ou Supabase Storage) est recommandé. Sur Render avec un disque persistant, le stockage local fonctionne directement.

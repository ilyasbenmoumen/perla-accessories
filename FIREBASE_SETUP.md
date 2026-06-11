# 🔥 Guide de configuration Firebase — Perla Accessories
## Résout le problème : commandes visibles sur tous les appareils

---

## Pourquoi Firebase ?

Avant, les commandes étaient stockées dans le **localStorage** du navigateur,
ce qui signifie qu'elles n'existaient que sur l'appareil où la commande a été passée.

Avec **Firebase Firestore**, toutes les commandes sont sauvegardées dans le **cloud**
et visibles depuis n'importe quel appareil ou navigateur.

---

## Étapes de configuration (5 minutes)

### 1. Créer un projet Firebase

1. Allez sur https://console.firebase.google.com/
2. Cliquez sur **"Ajouter un projet"**
3. Nommez-le `perla-accessories` (ou ce que vous voulez)
4. Désactivez Google Analytics (optionnel)
5. Cliquez **Créer le projet**

### 2. Créer la base de données Firestore

1. Dans le menu gauche → **Firestore Database**
2. Cliquez **Créer une base de données**
3. Choisissez **Mode production** (ou test pour commencer)
4. Sélectionnez la région : `europe-west1` (plus proche du Maroc)
5. Cliquez **Activer**

### 3. Configurer les règles de sécurité Firestore

Dans **Firestore → Règles**, collez ces règles :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Commandes : lecture/écriture publique (à sécuriser plus tard)
    match /orders/{orderId} {
      allow read, write: if true;
    }
    // Newsletter
    match /newsletter/{doc} {
      allow write: if true;
      allow read: if false;
    }
  }
}
```

### 4. Obtenir la configuration Firebase

1. Dans les paramètres du projet (⚙️ en haut à gauche)
2. Faites défiler jusqu'à **"Vos applications"**
3. Cliquez sur **"</>  Web"**
4. Donnez un nom à l'app (ex: `perla-web`)
5. **Ne cochez pas** Firebase Hosting (vous avez déjà Vercel)
6. Copiez le bloc `firebaseConfig`

### 5. Mettre à jour les fichiers du site

Ouvrez **`js/app.js`** et remplacez le bloc `FIREBASE_CONFIG` :

```javascript
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",          // ← Votre vraie clé
  authDomain:        "perla-xxx.firebaseapp.com",
  projectId:         "perla-xxx",
  storageBucket:     "perla-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc..."
};
```

Faites **exactement la même chose** dans **`admin/admin.js`**.

### 6. (Optionnel) Changer le mot de passe admin

Dans `admin/admin.js`, ligne 11 :
```javascript
const ADMIN_PASSWORD = "perla2024"; // ← Changez par votre mot de passe !
```

---

## Test

1. Déployez le site sur Vercel
2. Passez une commande test depuis votre téléphone
3. Ouvrez le panneau admin sur votre ordinateur (`/admin/`)
4. La commande doit apparaître ! ✅

---

## En cas d'erreur Firebase

Si Firebase n'est pas encore configuré, le site continue de fonctionner
en **mode local** (localStorage). Les commandes sont sauvegardées sur l'appareil
du client et dans le panneau admin du même appareil.

Une fois Firebase configuré, toutes les nouvelles commandes seront synchronisées.

---

## Déploiement sur Vercel

1. Allez sur https://vercel.com/
2. Importez votre dossier `perla-site`
3. Configuration : pas besoin de build, c'est du HTML/CSS/JS pur
4. Cliquez **Deploy**

Le `vercel.json` est déjà configuré pour le routing SPA.

---

© Perla Accessories — لمسة أناقة

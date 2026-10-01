# 🕌 awQat-salat

Affichage des horaires de prière sur écran TV, avec administration depuis un téléphone.
**100 % hors-ligne** — aucune dépendance externe, uniquement les modules natifs de Node.js.

---

## ✨ Fonctionnalités

- Affichage des horaires : **Sahour, Fajr, Lever du soleil, Zouhr, Assr, Maghrib, Isha** et **Joum'ah** (ou **Tahajud** en alternance).
- Grille **2 lignes × 4 colonnes**, mise à l'échelle automatique pour tout écran.
- Mise en surbrillance automatique de la **prochaine prière** (cycle quotidien).
- Dates **grégorienne** et **hijri** avec offset ajustable (vue de la lune).
- Nom de la masjid multi-lignes, logo optionnel.
- Message d'annonce en bas d'écran (hadith, verset…).
- **QR code** d'administration affichable en haut à gauche (scan → ouverture directe de l'admin).
- **Synchronisation en temps réel** entre l'admin et l'écran TV (SSE).
- **Capture PNG** de l'écran TV depuis l'admin.

## Screenshot

### TV

![TV](https://github.com/user-attachments/assets/07ae0a94-69db-458c-b61f-2685775d5337)

### Admin

![Admin](https://github.com/user-attachments/assets/b19b035f-e713-49e9-bb31-8c06c928df1b)

===

## Comment ça marche

## 🚀 Démarrer le serveur

### Première installation

Ouvre **Termux** ou un terminal de commande sur la TV (ou l'appareil sur la quel sera afficher les horraires) et place-toi dans le dossier du projet :

```bash
cd ~/awQat-salat
```

et demarre le serveur avec nodejs (prealablement installer):

```nodejs
node server.js
```

Tu verras apparaître dans le terminal

```Condole
=================================================
 Serveur "Horaires de Prière" démarré
 Version :              1.x.x
 Écran TV local :       http://localhost:3000/
 Administration locale : http://localhost:3000/admin.html
 Adresses réseau local (à utiliser depuis le téléphone) :
   → http://<ton adresse ip>:3000/admin.html
=================================================
```

Ensuite ouvre dans un navigateur web (recommandé avec un mode Kiosk), l'adresse [http://localhost:3000/](http://localhost:3000/)

===

### Sur l'ecran principale

L'écran affiche en permanence :

- Le **nom de la masjid** en haut,
- La **date** (grégorienne et/ou hijri)
- L'**heure actuelle**
- Les **horaires de prière** :
  `Sahour · Fajr · Lever du soleil · Zouhr · Assr · Maghrib · Isha · Joum'ah`
- La **prochaine prière** est mise en évidence avec un contour doré qui pulse doucement
- Un **message** en bas si tu en as configuré un (hadith, annonce…)
- Un petit **QR code** en haut à gauche

### Comment modifier les horaires

Tout se fait depuis ton **téléphone**,

1. **Scanne le QR code** affiché sur l'écran TV avec l'appareil photo de ton téléphone
2. La page d'administration s'ouvre automatiquement
3. Modifie ce que tu veux :
   - Les horaires de prière
   - Le nom de la masjid
   - Les dates affichées
   - La couleur du fond
   - Le message du bas
4. Appuie sur **Enregistrer**
5. ✨ La TV se met à jour **instantanément**, sans que tu touches à rien

> Si tu n'as pas de QR code sous la main, tu peux aussi taper l'adresse manuellement. Elle s'affiche dans la console quand tu démarres le serveur.

### Le bouton QR code sur la TV

En haut à gauche de l'écran, une petite icône **✪** ou **✦** :

- Appuie dessus → le QR code apparaît ou disparaît
- Pratique si tu veux le cacher pour une occasion spéciale (Ramadan, conférence…)

Il réapparaît tout seul après un redémarrage du serveur.

### 🎨 Changer la couleur

Dans l'admin, section **Masjid**, il y a un carré de couleur. Clique dessus, choisis une teinte, enregistre. Toute la TV s'adapte :

- Le fond
- Les cartes des horaires
- La carte de la prochaine prière
- Le QR code
- Le copyright en bas

**Une seule couleur à choisir**, tout suit automatiquement.

### Afficher Tahajud au lieu de Joum'ah

Dans l'admin, il y a un interrupteur :

- **Désactivé** → la 8ᵉ case affiche **Joum'ah**
- **Activé** → la 8ᵉ case affiche **Tahajud**

Pratique pendant le Ramadan ou les dix dernières nuits. Tu peux basculer d'un jour à l'autre sans changer la disposition de l'écran.

### Ajuster la date hijri

Si la date hijri ne correspond pas à ce que tu observes (vue de la lune), utilise les boutons **−** et **+** dans l'admin pour la décaler de 1 à 3 jours en avant ou en arrière.

### Faire une capture d'écran

Dans l'admin, le bouton **Capture** génère une image PNG de l'écran TV exactement comme il apparaît à l'instant présent. Pratique pour :

- Partager les horaires sur WhatsApp
- Imprimer un affichage
- Envoyer à quelqu'un qui n'est pas sur place

L'image fait 1920×1080 (qualité Full HD).

### En résumé, au quotidien

- **Le matin** : la TV s'allume, tout est là
- **Si les horaires changent** : tu prends ton téléphone, tu modifies, c'est enregistré
- **La veille de Ramadan** : tu actives Tahajud dans l'admin, la TV change toute seule
- **Pour un événement** : tu caches le QR code d'un appui
- **Rien à faire** : tout se met à jour automatiquement entre ton téléphone et la TV

C'est tout. L'app est faite pour être **invisible** : tu la configures une fois, et ensuite elle tourne toute seule.

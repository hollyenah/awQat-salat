# Horaires de Prière — Application pour Android TV

Application 100% hors-ligne d'affichage des horaires de prière, avec administration
depuis un smartphone sur le même réseau Wi-Fi local.

## ⚠️ Important : pourquoi pas `localStorage` ?

Le `localStorage` prévu dans le cahier des charges initial ne fonctionne **que dans un
seul navigateur, sur un seul appareil** : les données du téléphone ne peuvent pas être
lues par la TV, même sur le même Wi-Fi. Cette version utilise donc un **petit serveur
local** (fichier `server.js`, sans dépendance externe) qui joue le rôle de pont entre les
deux appareils : le téléphone envoie les modifications au serveur, qui les transmet
instantanément à l'écran TV. Le serveur ne nécessite aucun accès Internet — il ne
fonctionne que sur le réseau Wi-Fi local.

## Contenu du dossier

```
masjid-app/
├── server.js          → le serveur local (aucune dépendance à installer)
├── data.json           → les données actuelles (créé/mis à jour automatiquement)
├── package.json
└── public/
    ├── tv.html          → écran d'affichage public (à ouvrir sur la TV)
    └── admin.html        → panneau d'administration (à ouvrir sur le téléphone)
```

## Installation

Il faut un appareil avec **Node.js** installé (téléchargeable sur nodejs.org),
qui restera allumé et connecté au Wi-Fi de la mosquée. Deux options :

**Option A — directement sur l'Android TV**, via une application terminal comme
[Termux](https://termux.dev) (installe Node.js avec `pkg install nodejs`).

**Option B (recommandée, plus simple)** — sur un petit boîtier toujours allumé sur le
même réseau (mini-PC, Raspberry Pi, ancien ordinateur). La TV se contente alors
d'afficher une page web via son navigateur, comme n'importe quel autre appareil du Wi-Fi.

### Démarrage du serveur

```bash
cd masjid-app
node server.js
```

Le terminal affiche les adresses à utiliser, par exemple :

```
Écran TV local :        http://localhost:3000/
Administration locale :  http://localhost:3000/admin.html
Adresses réseau local (à utiliser depuis le téléphone) :
   → http://192.168.1.42:3000/admin.html
```

Le serveur doit rester lancé en permanence. Si l'appareil redémarre, il suffit de relancer
`node server.js` (les horaires déjà enregistrés sont conservés dans `data.json`).

## Utilisation

1. **Sur la TV** : ouvrir un navigateur en plein écran sur `http://<adresse-du-serveur>:3000/`
   (ou `http://localhost:3000/` si le serveur tourne sur la TV elle-même). Beaucoup de
   boîtiers Android TV permettent de configurer une page comme « application au démarrage ».
2. **Sur le téléphone** (connecté au même Wi-Fi) : ouvrir
   `http://<adresse-du-serveur>:3000/admin.html`. Si l'adresse exacte n'est pas connue,
   ouvrir `http://<adresse-du-serveur>:3000/info` depuis n'importe quel appareil du réseau
   pour l'afficher.
3. Modifier les champs souhaités et appuyer sur **Enregistrer** : l'écran TV se met à jour
   instantanément, sans rechargement manuel.

## Détails utiles

- **Champ « Date affichée »** : le texte est libre (ex. « Lundi 14 Septembre 2026 » ou
  avec la date hégirienne) et reste éditable manuellement, car un appareil hors-ligne ne
  peut pas toujours garder une horloge système fiable ni calculer seul la date hégirienne.
  L'**heure**, elle, défile en direct sur l'écran TV (horloge de l'appareil).
- **Prochaine prière mise en valeur** : sur l'écran TV, la case de la prochaine prière du
  jour s'illumine automatiquement en doré (Jum'ah n'est pas concernée par ce calcul,
  puisqu'elle n'a lieu qu'une fois par semaine).
- **Message du bas** : peut être entièrement masqué via l'interrupteur, pour un affichage
  épuré ne montrant que les horaires.
- **Personnalisation visuelle** : les couleurs, tailles de police et espacements sont
  regroupés en haut du `<style>` de `tv.html` (variables `--bg-deep`, `--gold`, etc.),
  modifiables sans toucher au reste du code.
- Un petit point en haut à droite de l'écran TV indique la connexion au serveur
  (vert = connecté, rouge = coupé — l'écran affiche alors les dernières données connues).


**Mise en place (une seule fois) :**

1. Installez **Termux** et **Termux:Boot** — depuis [F-Droid](https://f-droid.org), pas le Play Store (la version Play Store de Termux est abandonnée et bugue).
2. Dans Termux : `pkg install nodejs` puis transférez le dossier `masjid-app` dessus (via un câble, ou `termux-setup-storage` + copie depuis le stockage partagé).
3. Ouvrez Termux:Boot une fois (juste pour autoriser le démarrage automatique), puis créez le fichier `~/.termux/boot/start-masjid.sh` avec :
   ```sh
   #!/data/data/com.termux/files/usr/bin/sh
   termux-wake-lock
   cd ~/masjid-app
   node server.js
   ```
4. Rendez-le exécutable : `chmod +x ~/.termux/boot/start-masjid.sh`
5. Redémarrez la TV pour tester — le serveur doit démarrer seul, sans rien taper.

**Pour l'écran** : installez **Fully Kiosk Browser** (gratuite, faite pour Android TV) et configurez-la pour ouvrir `http://localhost:3000/` en plein écran au démarrage. Comme ça, après une coupure de courant, tout revient automatiquement : serveur + affichage, sans manipulation.
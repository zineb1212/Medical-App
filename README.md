# 🏥 Medical App - Guide d'Installation Local

Ce guide vous explique comment installer et lancer le projet (Frontend, Backend, Base de données) sur votre machine locale.

## 📋 Prérequis

Assurez-vous d'avoir installé les logiciels suivants sur votre PC :

*   **Docker Desktop** : [Télécharger ici](https://www.docker.com/products/docker-desktop/)
*   **Node.js** (v18 ou supérieur) : [Télécharger ici](https://nodejs.org/)
*   **Python** (v3.8 ou supérieur) : [Télécharger ici](https://www.python.org/downloads/)

    ```bash
    git lfs install
    git clone https://github.com/zineb1212/Medical-App.git
    ```

---

## 🚀 Étape 1 : Lancer la Base de Données (Docker)

Nous utilisons Docker pour héberger la base de données PostgreSQL.

1.  Ouvrez un terminal à la racine du projet (`Medical_app/`).
2.  Lancez les conteneurs avec la commande suivante :

    ```bash
    docker-compose up -d
    ```

    *Cela va démarrer PostgreSQL sur le port `5432` et pgAdmin sur le port `5050`.*

---

## 🐍 Étape 2 : Configurer et Lancer le Backend

Le backend est codé en Python (Flask).

1.  Ouvrez un **nouveau terminal** et allez dans le dossier `backend` :
    ```bash
    cd backend
    ```

2.  Créez un environnement virtuel (pour isoler les librairies) :
    ```bash
    python -m venv venv
    ```

3.  Activez l'environnement virtuel :
    *   **Sur Windows (PowerShell)** :
        ```bash
        .\venv\Scripts\activate
        ```
    *   Sur Mac/Linux :
        ```bash
        source venv/bin/activate
        ```

4.  Installez les dépendances :
    ```bash
    pip install -r requirements.txt
    ```

5.  Configurez les variables d'environnement :
    *   Copiez le fichier d'exemple `.env.example` et renommez-le en `.env`.
    *   Si vous n'avez pas changé les configurations Docker par défaut, le fichier `.env` actuel devrait fonctionner tel quel.

6.  Lancez le serveur backend :
    ```bash
    python app.py
    ```

    *Le backend sera accessible sur `http://localhost:5000`.*

---

## ⚛️ Étape 3 : Configurer et Lancer le Frontend

Le frontend est codé en React (Next.js).

1.  Ouvrez un **troisième terminal** et allez dans le dossier `frontend` :
    ```bash
    cd frontend
    ```

2.  Installez les dépendances Node.js :
    ```bash
    npm install
    ```

3.  Lancez le serveur de développement :
    ```bash
    npm run dev
    ```

    *Le frontend sera accessible sur `http://localhost:3000`.*

---

## 🔍 Récapitulatif des Accès

*   **Application Web** : [http://localhost:3000](http://localhost:3000)
*   **API Backend** : [http://localhost:5000](http://localhost:5000)
*   **Gestion Base de Données (pgAdmin)** : [http://localhost:5050](http://localhost:5050)
    *   *Email* : `admin@admin.com`
    *   *Password* : `root`

---

## 🛠 Dépannage

*   **Erreur de base de données ?** Vérifiez que Docker Desktop est bien lancé et que la commande `docker-compose up -d` a fonctionné sans erreur.
*   **Module Python manquant ?** Vérifiez que vous avez bien activé l'environnement virtuel (`venv`) avant de faire le `pip install`.

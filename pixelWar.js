const baseUrl = 'https://pixel-api.codenestedu.fr';

async function recupererTableauPixels() {
    try {
        const reponse = await fetch(`${baseUrl}/tableau`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        if (!reponse.ok) throw new Error(reponse.status);
        const tableauPixels = await reponse.json();
        afficherGrille(tableauPixels);
    } catch (erreur) {
        afficherMessage("Erreur de récupération du tableau", true);
    }
}

function afficherGrille(tableau) {
    const gridContainer = document.getElementById('pixel-grid');            
    gridContainer.innerHTML = ''; 
    if (!tableau || tableau.length === 0) return;
    
    const nbLignes = tableau.length;
    const nbColonnes = tableau[0].length;
    
    gridContainer.style.gridTemplateColumns = `repeat(${nbColonnes}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${nbLignes}, 1fr)`;
    
    for (let i = 0; i < nbLignes; i++) {
        for (let j = 0; j < nbColonnes; j++) {
            const pixelDiv = document.createElement('div');
            pixelDiv.classList.add('pixel');
            pixelDiv.style.backgroundColor = tableau[i][j] || '#000000';
            pixelDiv.addEventListener('click', () => modifierPixel(i, j));
            gridContainer.appendChild(pixelDiv);
        }
    }
}

async function modifierPixel(row, col) {
    const uid = document.getElementById('uid').value;
    const color = document.getElementById('color').value;
    
    if (!uid) {
        afficherMessage("Veuillez entrer un UID", true);
        return;
    }

    try {
        const reponse = await fetch(`${baseUrl}/modifier-case`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ color, uid, col, row })
        });
        const data = await reponse.json();
        afficherMessage(data.msg);
        if (reponse.ok) {
            recupererTableauPixels();
            recupererListeJoueurs(); 
        }
    } catch (erreur) {
        afficherMessage("Erreur réseau lors de la modification", true);
    }
}

async function choisirEquipe(nouvelleEquipe) {
    const uid = document.getElementById('uid').value;
    if (!uid) {
        afficherMessage("Veuillez entrer un UID", true);
        return;
    }

    try {
        const reponse = await fetch(`${baseUrl}/choisir-equipe`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, nouvelleEquipe })
        });
        const data = await reponse.json();
        afficherMessage(data.msg);
        if (reponse.ok) recupererListeJoueurs();
    } catch (erreur) {
        afficherMessage("Erreur réseau lors du choix d'équipe", true);
    }
}

async function verifierTempsAttente() {
    const uid = document.getElementById('uid').value;
    const waitTimeDiv = document.getElementById('wait-time');
    if (!uid) return;

    try {
        const reponse = await fetch(`${baseUrl}/temps-attente?uid=${uid}`);
        if (reponse.ok) {
            const data = await reponse.json();
            if (data.tempsAttente > 0) {
                waitTimeDiv.textContent = `Veuillez patienter ${data.tempsAttente/1000} secondes`;
            } else {
                waitTimeDiv.textContent = "Vous pouvez modifier un pixel";
            }
        }
    } catch (erreur) {}
}
async function recupererListeJoueurs() {
    const uid = document.getElementById('uid').value;
    const playersContainer = document.getElementById('players-list');

    if (!uid) {
        playersContainer.innerHTML = '<div class="player-info-msg">Entrez votre UID à droite pour voir les joueurs.</div>';
        return;
    }

    try {
        const reponse = await fetch(`${baseUrl}/liste-joueurs?uid=${uid}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!reponse.ok) {
            if (reponse.status === 403) {
                playersContainer.innerHTML = '<div class="player-info-msg" style="color:red;">UID inconnu, impossible de charger les joueurs.</div>';
            }
            throw new Error(reponse.status);
        }
        
        let joueurs = await reponse.json();
        
        joueurs.sort((a, b) => new Date(b.lastModificationPixel) - new Date(a.lastModificationPixel));

        playersContainer.innerHTML = '';

        joueurs.forEach(joueur => {
            const dateModif = new Date(joueur.lastModificationPixel);
            const dateFormatee = dateModif.toLocaleString('fr-FR');
            
            const card = document.createElement('div');
            card.className = `player-card ${joueur.banned ? 'banned' : 'active'}`;
            
            card.innerHTML = `
                <div class="player-name">${joueur.nom}</div>
                <div class="player-details">
                    <span><strong>Équipe :</strong> ${joueur.equipe ? joueur.equipe : 'Aucune'}</span>
                    <span><strong>Modifications :</strong> ${joueur.nbPixelsModifies}</span>
                    <span><strong>Dernière :</strong> ${dateFormatee}</span>
                    ${joueur.banned ? '<span class="banned-text">BANNI</span>' : ''}
                </div>
            `;
            playersContainer.appendChild(card);
        });

    } catch (erreur) {
        console.error("Erreur lors de la récupération des joueurs :", erreur);
    }
}

function afficherMessage(msg, isError = false) {
    const msgDiv = document.getElementById('server-message');
    msgDiv.textContent = msg;
    msgDiv.style.color = isError ? 'red' : 'black';
}
recupererTableauPixels();
setInterval(recupererTableauPixels, 5000);
setInterval(verifierTempsAttente, 1000);
setInterval(recupererListeJoueurs, 5000);
document.getElementById('uid').addEventListener('blur', recupererListeJoueurs);
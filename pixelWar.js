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
            if (reponse.ok) recupererTableauPixels();
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

    function afficherMessage(msg, isError = false) {
        const msgDiv = document.getElementById('server-message');
        msgDiv.textContent = msg;
        msgDiv.style.color = isError ? 'red' : 'black';
    }

    recupererTableauPixels();
    setInterval(recupererTableauPixels, 5000);
    setInterval(verifierTempsAttente, 1000);

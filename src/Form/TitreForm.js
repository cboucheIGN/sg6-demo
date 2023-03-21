import { Subject } from 'rxjs';
import Component from '../Core/Component.js';
import DialogService from '../Services/DialogService.js';
import EditeurService from '../Services/EditeurService.js';
import HtmlConverterService from '../Services/HtmlConverterService.js';
import StorageService from '../Services/StorageService.js';

class TitreForm extends Component {

    form;

    titre;

    onSave = new Subject();

    constructor(titre) {
        super();
        this.name = 'form-titre';

        this.titre = titre;

        this.storageService = new StorageService();
        this.dialogService = new DialogService();
        this.editeurService = new EditeurService();
    }


    valid(event) {
        const selector = `.${this.name} form`;
        const form = document.querySelector(selector);
        
        if (form.niveau.value === '') {
            alert("Le niveau du titre doit être renseigné");
            return;
        }

        if (form.niveau.value < 1 || form.niveau.value > 4) {
            alert("Le niveau du titre doit être compris entre 1 et 4");
            return;
        }
        
        this.titre.id =             form.id.value;
        this.titre.intitule =       form.intitule.value;
        this.titre.niveau =         parseInt(form.niveau.value);
        this.titre.numero =         parseInt(form.numero.value);
        this.titre.href =           form.href.value;
        this.titre.idZone =         form.idZone.value;
        this.titre.idPrescription = form.idPrescription.value;

        // save titre dans reglement
        const reglement = this.storageService.getReglement();
        const existing = reglement.getTitreById(this.titre.id);
        if (existing) {
            // mise à jour des attributs par copie
            // on en touche pas au children / contents
            reglement.updateTitre(this.titre);
        } else {
            // cas mise à jour pour les titre de niveau 1
            // les titres de niveau 2+ sont creer au parsing du document
            reglement.addTitre(this.titre);
        }
        
        this.onSave.next(this.titre);

        this.storageService.save(reglement);

        this.setZone();

        // reload metadata attribute
        this.editeurService.updateTitreNode(this.titre);
        
        this.editeurService.setContent(this.getUpdatedContent());


        this.close();

        for(var i=0; i<document.getElementById("title-list").children.length-1; i++){
            if(document.getElementById("title-list").children[i+1].getAttribute("niveau") <= document.getElementById("title-list").children[i].getAttribute("niveau")) {
                document.getElementById("title-list").children[i].children[1].classList.add("hidden");
            } else{
                document.getElementById("title-list").children[i].children[1].classList.remove("hidden");
            }
        }
    }


    close(event) {
        this.dialogService.close();
    }

    setZone() {
        var zone = false;
        var reglement = this.storageService.getReglement();
        var titres = reglement.titres;
        for(var i in titres) {
            if(titres[i].niveau == 1) {
                zone = titres[i].idZone;
            } else if(zone){
                titres[i].idZone = zone;
                reglement.updateTitre(titres[i]);
            }
        }
        this.storageService.save(reglement);
    }

    checkZoneInput(event) {

        var titres = this.storageService.getReglement().titres;

        var elem = document.getElementById("idZone");
        var niveau = document.getElementById("niveau").value;

        if(niveau != "1" && !document.getElementById("idZone").attributes.disabled) {
            elem.setAttribute("disabled", "");
            elem.classList.toggle("grey");
            elem.labels[0].classList.toggle("grey");
            var zone;
            for(var i=titres.length-1; i >- 1; i--) {
                if(titres[i].niveau == 1) {
                    zone = titres[i].idZone;
                    break;
                }
            }
            elem.value = zone;
            
        } else if(niveau == "1" && document.getElementById("idZone").attributes.disabled) {
            elem.removeAttribute("disabled");
            elem.value = "";
            elem.classList.toggle("grey");
            elem.labels[0].classList.toggle("grey");
        }
    }

    getTemplate() {
        return `
            <h4>Modifier le Titre ${this.titre.niveau}</h4>
            <form>
                <label for="id" class="hidden">Identifiant</label>
                <input id="id" class="hidden" type="string" value="${this.titre.id || ''}" readonly>
                <label for="intitule">Intitulé</label>
                <input id="intitule" type="string" value="${this.titre.intitule || ''}" placeholder="Titre I : disposition générales">
                <label for="niveau">Niveau</label>
                <input id="niveau" type="number" min="1" max="4" value="${this.titre.niveau || 1}">
                <label for="numero">Numéro</label>
                <input id="numero" type="number" value="${this.titre.numero || 1}">
                <label for="href">Référence interne</label>
                <input id="href" type="string" value="${this.titre.href || ''}" placeholder="I">
                <label for="idZone">Zone (U, Ua, ect.)</label>
                <input id="idZone" type="string" value="${this.titre.idZone || ''}" placeholder="U">
                <label for="idPrescription">Identifiant de prescription si nécessaire</label>
                <input id="idPrescription" type="string" value="${this.titre.idPrescription || ''}">
            </form>
            <div class="form-action">
                <div class="separator"></div>
                <button class="btn-valid">Mettre à jour / Créer le titre</button>
                <button class="btn-close">Annuler</button>
            </div>
        `;
    }


    registerEvents() {
        document.getElementById("niveau").addEventListener('change', event => this.checkZoneInput(event));

        const validSelector = `.${this.name} .btn-valid`;
        document.querySelector(validSelector).addEventListener('click', event => this.valid(event));

        const closeSelector = `.${this.name} .btn-close`;
        document.querySelector(closeSelector).addEventListener('click', event => this.close(event));
    }

    getUpdatedContent() {
        var html = this.editeurService.getContent();
        var ind1 = html.search(/\<h[0-9]/) + 2;
        var niveauActuel = html.substring(ind1, ind1+1);
        

        if(ind1 != 1 && this.titre.niveau.toString() != niveauActuel) {
            html = html.replace(/<h[0-9]/, "<h" + this.titre.niveau.toString());
        }

        var m = html.match(/\<h.*\<\/h/);
        if(m) {
            var ind2 = m[0].search(/\>/)+1;
            var intituleActuel = m[0].substring(ind2, m[0].length-3);

            if(this.titre.intitule != intituleActuel) {
                html = html.replace(m[0], m[0].replace(intituleActuel + "</h", this.titre.intitule + "</h"));
            }
        }
        return html;
    }

}

export default TitreForm;

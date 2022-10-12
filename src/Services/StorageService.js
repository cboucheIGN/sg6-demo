import { Subject } from 'rxjs';
import Reglement from '../Model/Reglement';

class StorageService {

    reglement;

    activeTitre;

    change = new Subject();

    constructor() {
        if (StorageService.instance) {
            return StorageService.instance;
        }
        StorageService.instance = this;
    }

    save(reglement) {
        this.reglement = reglement;
        this.saveToLocalStorage();
        this.change.next(this.reglement);
    }

    saveToLocalStorage() {
        localStorage.setItem('reglement', JSON.stringify(this.reglement));
    }

    loadFromLocalStorage() {
        this.reglement = new Reglement().unserialise(JSON.parse(localStorage.getItem('reglement')));

        this.change.next(this.reglement);
    }

    setReglement(reglement) {
        this.reglement = reglement;
    }

    getReglement() {
        return this.reglement;
    }

    setActiveTitre(titre) {
        this.activeTitre = titre;
    }

    getActiveTitre() {
        return this.activeTitre;
    }

}

// export new singleton
export default StorageService;

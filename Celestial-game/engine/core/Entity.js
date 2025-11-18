import { Model } from '../core/core.js';

export class Entity {

    constructor(components = [], name="noName") {
        this.components = components;
        this.name = name;
        this.children = [];

    }

    addComponent(component) {
        this.components.push(component);
    }

    removeComponent(component) {
        this.components = this.components.filter(c => c !== component);
    }

    removeComponentsOfType(type) {
        this.components = this.components.filter(component => !(component instanceof type));
    }

    getComponentOfType(type) {
        return this.components.find(component => component instanceof type);
    }

    getComponentsOfType(type) {
        return this.components.filter(component => component instanceof type);
    }

    //needed for animation - to import skinned object
    addChild(entity){
        this.children.push(entity);
    }

    //funkcija ki izpise hierarhijo... basically izpise vse otroke in njihova imena (dopise tudi [Model] pri otroku ki ga ima)
    printTree(indent = "") {
        const model = this.getComponentOfType(Model);
        console.log(indent + this.name + (model ? " [Model]" : ""));
        for (const c of this.children) c.printTree(indent + "  ");
    }
}

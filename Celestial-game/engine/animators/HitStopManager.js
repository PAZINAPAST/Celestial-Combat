export class HitStopManager {

    constructor() {
        this.timer = 0;
        this.active = false;
        this.targets = [];
    }

    addTarget(animator) {
        this.targets.push(animator);
    }

    trigger(duration) {
        this.timer = duration;
        this.active = true;
        this.targets.forEach(anim => anim.paused = true);
    }

    update(dt) {
        if(!this.active)
            { return;}
        
        this.timer -= dt;
        if(this.timer <= 0) {
            this.active = false;
            this.targets.forEach(anim => anim.paused = false);
        }

    }

}
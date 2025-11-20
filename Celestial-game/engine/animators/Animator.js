export class Animator {

    constructor(animations) {
        this.animations = animations;   // raw glTF animations (array of animations)
        this.current = null;            // animation index
        this.time = 0;                  // playback time in seconds
        this.playing = false;
        this.loop = false;
        this.playingAnim =  -1          //indeks animacije ki se predvaja
        this.animLen = -1;
    }

    play(index) {
        //const index = this.animations.findIndex(a => a.name === name);
        //if (index === -1) return console.warn("Animation not found:", name);
        this.current = index;
        this.time = 0;
        this.playing = true;
        this.playingAnim = index;
        this.animLen = this.animations[index].maxTime;
    }

    update1(dt) {
        if (!this.playing || this.current === null) return;
        this.time += dt;
        const anim = this.animations[this.current];
        //const anim = this.animations; //it's actually just one animation
        const duration = anim.maxTime;

        if (this.time > duration) {
            if (this.loop) this.time = this.time % duration;
            else {
                this.time = duration;
                this.playing = false;
            }
        }
    }
}

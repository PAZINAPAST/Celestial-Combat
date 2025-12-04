export class Animator {

    constructor(animations) {
        this.animations = animations;   // raw glTF animations (array of animations)
        this.current = null;            // animation index
        this.time = 0;                  // playback time in seconds
        this.playing = false;
        this.loop = false;
        this.playingAnim =  -1          //indeks animacije ki se predvaja
        this.animLen = -1;              //dolzina animacije v sekundah
        this.cut = 0;                   //koliko sekund skrajsamo animacijo (se cut-sekund predcasno konca)
    }

    play(index) {
        //const index = this.animations.findIndex(a => a.name === name);
        //if (index === -1) return console.warn("Animation not found:", name);
        this.current = index;
        this.time = 0;
        this.playing = true;
        this.playingAnim = index;
        this.animLen = this.animations[index].maxTime;
        this.cut = 0;
        //console.log("trajanje animacije: " + this.animLen)
    }


    //funkcija ki zacne animacijo pri "start" in konca "end" sekund pred koncem
    playShort(index, start, end){
        this.current = index;
        this.time = start;
        this.playing = true;
        this.playingAnim = index;
        this.animLen = this.animations[index].maxTime;
        this.cut = end;
    }

    update1(dt) {
        if (!this.playing || this.current === null) return;     //ce se nobena animacija ne predvaja, potem nic ne naredi
        this.time += dt;
        const anim = this.animations[this.current];

        const duration = anim.maxTime - this.cut;

        if (this.time > duration) {
            if (this.loop) this.time = this.time % duration;    //loopaj animacijo
            else {
                this.time = duration;   //koncaj animacijo ker je cas presegel dolzino animacije
                this.playing = false;
            }
        }
    }
}

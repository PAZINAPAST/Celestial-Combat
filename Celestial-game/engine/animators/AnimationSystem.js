import {    
    Transform,
} from 'engine/core/core.js';

import { Animator } from './Animator.js';
import { mat4, vec3, quat } from 'glm';

export class AnimationSystem {

    update(scene, dt) {
        for (const entity of scene) {
            this.updateRecursive(entity, dt);
        }
    }

    updateRecursive(entity, dt) {

        const animator = entity.getComponentOfType(Animator);
        
        if (animator) {
            animator.update1(dt);
            if (animator.playing)
                this.applyAnimation(animator);
        }

        for (const child of entity.children) {
            this.updateRecursive(child, dt);
        }
    }

    applyAnimation(animator) {
        const anim = animator.animations[animator.current];
        //const anim = animator.animations;  //its actually just one animation
        const t = animator.time;

        for (const channel of anim.channels) {
            const transform = channel.target.getComponentOfType(Transform);

            if (!transform) continue;

            const times = channel.times;
            const values = channel.values;

            // find keyframe index
            let i = 0;
            while (i < times.length - 1 && t >= times[i+1])
                i++;

            const t0 = times[i];            //t0 in t1 sta timestamp-a za dva zaporedna keyframe-a v animaciji
            const t1 = times[i+1] ?? t0;

            const u = t1 > t0 ? (t - t0) / (t1 - t0) : 0;

            if (channel.type === "translation") {
                const v0 = values[i];
                const v1 = values[i+1] ?? v0;
                vec3.lerp(transform.translation, v0, v1, u);
            }
            else if (channel.type === "scale") {
                const v0 = values[i];
                const v1 = values[i+1] ?? v0;
                vec3.lerp(transform.scale, v0, v1, u);
            }
            else if (channel.type === "rotation") {
                const v0 = values[i];
                const v1 = values[i+1] ?? v0;
                quat.slerp(transform.rotation, v0, v1, u);
            }
        }
    }
}

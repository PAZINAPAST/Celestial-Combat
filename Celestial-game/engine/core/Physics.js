import { vec3, mat4 } from 'glm';
import { getGlobalModelMatrix } from 'engine/core/SceneUtils.js';
import { Transform, Parent } from 'engine/core/core.js';

export class Physics {

    constructor(scene) {
        this.scene = scene;
    }

    update(t, dt) {
        for (const entity of this.scene) {
            if (entity.customProperties?.isDynamic || entity.customProperties?.isStatic) {
                for (const other of this.scene) {
                    if (entity !== other && (other.customProperties?.isStatic || other.customProperties?.isDynamic)) {
                        this.resolveCollision(entity, other);
                    }
                }
            }
        }
    }

    intervalIntersection(min1, max1, min2, max2) {
        return !(min1 > max2 || min2 > max1);
    }

    aabbIntersection(aabb1, aabb2) {
        return this.intervalIntersection(aabb1.min[0], aabb1.max[0], aabb2.min[0], aabb2.max[0])
            && this.intervalIntersection(aabb1.min[1], aabb1.max[1], aabb2.min[1], aabb2.max[1])
            && this.intervalIntersection(aabb1.min[2], aabb1.max[2], aabb2.min[2], aabb2.max[2]);
    }

    getTransformedAABB(entity) {
        // Transform all vertices of the AABB from local to global space.
        const matrix = getGlobalModelMatrix(entity);
        const { min, max } = entity.aabb;
        const vertices = [
            [min[0], min[1], min[2]],
            [min[0], min[1], max[2]],
            [min[0], max[1], min[2]],
            [min[0], max[1], max[2]],
            [max[0], min[1], min[2]],
            [max[0], min[1], max[2]],
            [max[0], max[1], min[2]],
            [max[0], max[1], max[2]],
        ].map(v => vec3.transformMat4(v, v, matrix));

        // Find new min and max by component.
        const xs = vertices.map(v => v[0]);
        const ys = vertices.map(v => v[1]);
        const zs = vertices.map(v => v[2]);
        const newmin = [Math.min(...xs), Math.min(...ys), Math.min(...zs)];
        const newmax = [Math.max(...xs), Math.max(...ys), Math.max(...zs)];
        return { min: newmin, max: newmax };
    }

    resolveCollision(a, b) {
        // Get global space AABBs.

        //ce je kateri izmed njiju v zraku, potem ne delalaj kolizije
        if (a.getComponentOfType(Parent).entity.getComponentOfType(Transform).translation[1] > -0.5 || b.getComponentOfType(Parent).entity.getComponentOfType(Transform).translation[1] > -0.5){
            //console.log("somebody airborn");
            return;
        }

        if (!a.aabb) { console.warn('No AABB for', a.name); return; }
        if (!b.aabb) { console.warn('No AABB for', b.name); return; }

        // const aBox = this.getTransformedAABB(a);
        // const bBox = this.getTransformedAABB(b);

        //spodnja koda naredi to, da vzame bounding box obeh objektov, ga zmanjsa (skalira) za nek faktor in nato premakne glede na translation objekta
        const a_position = a.getComponentOfType(Parent).entity.getComponentOfType(Transform).translation;
        const b_position = b.getComponentOfType(Parent).entity.getComponentOfType(Transform).translation;
        const a_moved_aabb_min = [...a.aabb.min];  //... - pomeni da gremo cez vse elemente tega arraya in ustvarimo nov array z isto vsebino 
        const a_moved_aabb_max = [...a.aabb.max];
        const b_moved_aabb_min = [...b.aabb.min];
        const b_moved_aabb_max = [...b.aabb.max];

        let factor1 = 0.8;
        vec3.multiply(a_moved_aabb_max, a_moved_aabb_max, [factor1, 1, factor1]);
        vec3.multiply(a_moved_aabb_min, a_moved_aabb_min, [factor1, 1, factor1]);
        vec3.multiply(b_moved_aabb_max, b_moved_aabb_max, [factor1, 1, factor1]);
        vec3.multiply(b_moved_aabb_min, b_moved_aabb_min, [factor1, 1, factor1]);


        vec3.add(a_moved_aabb_min, a_moved_aabb_min, a_position);
        vec3.add(a_moved_aabb_max, a_moved_aabb_max, a_position);
        vec3.add(b_moved_aabb_min, b_moved_aabb_min, b_position);
        vec3.add(b_moved_aabb_max, b_moved_aabb_max, b_position);


        const aBox = {min: a_moved_aabb_min, max: a_moved_aabb_max};
        const bBox = {min: b_moved_aabb_min, max: b_moved_aabb_max};

        // Check if there is collision.
        const isColliding = this.aabbIntersection(aBox, bBox);
        if (!isColliding) {
            return;
        }

        // Move entity A minimally to avoid collision.
        const diffa = vec3.sub(vec3.create(), bBox.max, aBox.min);
        const diffb = vec3.sub(vec3.create(), aBox.max, bBox.min);

        let minDiff = Infinity;
        let minDirection = [0, 0, 0];
        if (diffa[0] >= 0 && diffa[0] < minDiff) {
            minDiff = diffa[0];
            minDirection = [minDiff, 0, 0];
        }
        if (diffa[1] >= 0 && diffa[1] < minDiff) {
            minDiff = diffa[1];
            minDirection = [0, minDiff, 0];
        }
        if (diffa[2] >= 0 && diffa[2] < minDiff) {
            minDiff = diffa[2];
            minDirection = [0, 0, minDiff];
        }
        if (diffb[0] >= 0 && diffb[0] < minDiff) {
            minDiff = diffb[0];
            minDirection = [-minDiff, 0, 0];
        }
        if (diffb[1] >= 0 && diffb[1] < minDiff) {
            minDiff = diffb[1];
            minDirection = [0, -minDiff, 0];
        }
        if (diffb[2] >= 0 && diffb[2] < minDiff) {
            minDiff = diffb[2];
            minDirection = [0, 0, -minDiff];
        }

        let transform_a;
        let transform_b;

        if (a.isAnimated){
            transform_a = a.getComponentOfType(Parent).entity.getComponentOfType(Transform);
        } else{
            transform_a = a.getComponentOfType(Transform);
        }

        if (b.isAnimated){
            transform_b = b.getComponentOfType(Parent).entity.getComponentOfType(Transform);
        } else{
            transform_b = b.getComponentOfType(Transform);
        }

        if (!transform_a || !transform_b) {
            console.log("no transform found");
            return;
        }


        minDirection[1] = 0;    //zato da se collision razresi samo v x-smeri (v ostalih oseh pa je 0)
        minDirection[2] = 0;

        //ce sta prevec blizu skupaj se collision ne bo dobro razresil - ju je treba premakniti (v pravo smer)
        let dx = 0.007;
        if (Math.abs(a_position[0] - b_position[0]) < 0.5){
            if (a_position[0] < b_position[0]){
                transform_a.translation[0] -= dx;
                transform_b.translation[0] += dx;
            } else{
                transform_a.translation[0] += dx;
                transform_b.translation[0] -= dx;
            }
        }

        //ce se samo en character premika potem upocasni njegov premik, ce pa se premikata drug proti drugem pa se ustavita (oba se premakneta za 0.5*minDirection, le v nasprotno smer)
        vec3.multiply(minDirection, minDirection, [0.5, 0.5, 0.5]);
        vec3.add(transform_a.translation, transform_a.translation, minDirection);
        vec3.multiply(minDirection, minDirection, [-1, -1, -1]);
        vec3.add(transform_b.translation, transform_b.translation, minDirection);
        
        
    }

}

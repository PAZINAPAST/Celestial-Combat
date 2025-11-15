import { quat } from 'glm';

import { Camera , Entity, Transform, Model, Primitive, Material} from 'engine/core/core.js';

import { OBJLoader } from 'engine/loaders/OBJLoader.js';

import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { UnlitRenderer } from 'engine/renderers/UnlitRenderer.js';

const loader = new OBJLoader();
const mesh = await loader.load(new URL('../../../models/sun/sonce-proto.obj', import.meta.url));

//const scene = loader.loadScene();
const material = new Material({ baseFactor: [1, 1, 1, 1] });
const primitive = new Primitive({ mesh, material });
const model = new Model({ primitives: [primitive] });

const meshEntity = new Entity([
    mesh,
    new Transform()
]);
//const camera = scene.find(entity => entity.getComponentOfType(Camera));
const cameraEntity = new Entity([
    new Camera({fovy: 1, aspect:1, near:0.01, far:1000}),
    new Transform({translation: [0,0,5]})
]);

const scene = [meshEntity, cameraEntity];

const camera = cameraEntity;

const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

function update(t, dt) {
    for (const entity of scene) {
        for (const component of entity.components) {
            component.update?.(t, dt);
        }
    }
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
    //camera.aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

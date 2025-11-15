import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { GLTFLoader } from 'engine/loaders/GLTFLoader.js';
import { UnlitRenderer } from 'engine/renderers/UnlitRenderer.js';
import { TouchController } from 'engine/controllers/TouchController.js';

import { Camera , Entity, Transform} from 'engine/core/core.js';



const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

const loader = new GLTFLoader();
await loader.load(new URL('../../../models/sonce/sonce.gltf', import.meta.url));

const scene = loader.loadScene();
if (!scene) {
    throw new Error('A default scene is required to run this example');
}
/*
const camera = scene.find(entity => entity.getComponentOfType(Camera));
if (!camera) {
    throw new Error('A camera in the scene is require to run this example');
}*/

const camera = new Entity();
camera.addComponent(new Transform({translation : [0, 5, 0]}));
camera.addComponent(new Camera());
camera.addComponent(new TouchController(camera, canvas, {
    distance: 5,
}));

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ render }).start();

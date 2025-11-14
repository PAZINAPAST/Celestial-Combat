import { GUI } from 'dat';

import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';
import { loadResources } from 'engine/loaders/resources.js';
import { TouchController } from 'engine/controllers/TouchController.js';

import {
    Camera,
    Entity,
    Material,
    Model,
    Primitive,
    Sampler,
    Texture,
    Transform,
} from 'engine/core/core.js';

import { Renderer } from './Renderer.js';
import { Light } from './Light.js';

const resources1 = await loadResources({
    'mesh': new URL('../../../models/sun/sonce-proto.obj', import.meta.url),
    'image': new URL('../../../models/monkey/base.png', import.meta.url),
});

const resources2 = await loadResources({
    'mesh' : new URL('../../../models/earth/zemlja-proto.obj', import.meta.url),
    'image': new URL('../../../models/monkey/base.png', import.meta.url),
});

const resources3 = await loadResources({
    'mesh': new URL('../../../models/floor/floor.json', import.meta.url),
    'image': new URL('../../../models/space/vesolje.jpg', import.meta.url),
});

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas);
await renderer.initialize();

const model1 = new Entity();
model1.addComponent(new Transform({translation : [1,-2,0]}));
model1.addComponent(new Model({
    primitives: [
        new Primitive({
            mesh: resources1.mesh,
            material: new Material({
                baseTexture: new Texture({
                    image: resources1.image,
                    sampler: new Sampler(),
                }),
            }),
        }),
    ],
}));


const model2 = new Entity();
model2.addComponent(new Transform({translation: [-1,-2,0]}));
model2.addComponent(new Model({
    primitives: [
        new Primitive({
            mesh: resources2.mesh,
            material: new Material({
                baseTexture: new Texture({
                    image: resources2.image,
                    sampler: new Sampler(),
                }),
            }),
        }),
    ],
}));

const camera = new Entity();
camera.addComponent(new Transform({translation : [0, 10, 0]}));
camera.addComponent(new Camera());
camera.addComponent(new TouchController(camera, canvas, {
    distance: 5,
}));

const floor = new Entity();
floor.addComponent(new Transform({
    scale: [10, 1, 10],
    translation: [0,-2,0]
}));
floor.addComponent(new Model({
    primitives: [
        new Primitive({
            mesh: resources3.mesh,
            material: new Material({
                baseTexture: new Texture({
                    image: resources3.image,
                    sampler: new Sampler({
                        minFilter: 'linear',
                        magFilter: 'linear',
                        addressModeU: 'clamp-to-edge',
                        addressModeV: 'clamp-to-edge',
                    }),
                }),
            }),
        }),
    ],
}));



//const loader = new GLTFLoader();
//await loader.load(new URL('../../../models/sun/sonce-proto.gltf', import.meta.url));

//const scene = loader.loadScene();
//const camera = loader.loadNode('Camera');
//camera.addComponent(new TouchController(camera, canvas, { distance: 5 }));

//const model = loader.loadNode('Suzanne');

const scene = [
    model1,
    model2,
    floor,
    camera,
];

const light = new Entity();
light.addComponent(new Light({
    direction: [-1, 1, 1],
}));
scene.push(light);

function update(time, dt) {
    for (const entity of scene) {
        for (const component of entity.components) {
            component.update?.(time, dt);
        }
    }
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

const gui = new GUI();
gui.add(renderer, 'perFragment');

const lightSettings = light.getComponentOfType(Light);
const lightFolder = gui.addFolder('Light');
lightFolder.open();
lightFolder.addColor(lightSettings, 'color');

const lightDirection = lightFolder.addFolder('Direction');
lightDirection.open();
lightDirection.add(lightSettings.direction, 0, -1, 1).name('x');
lightDirection.add(lightSettings.direction, 1, -1, 1).name('y');
lightDirection.add(lightSettings.direction, 2, -1, 1).name('z');

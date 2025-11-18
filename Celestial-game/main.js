import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

//import { UnlitRenderer } from 'engine/renderers/UnlitRenderer.js';
import { SkyBoxRenderer } from 'engine/renderers/SkyBoxRenderer.js';
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
    Light,
    Parent
} from 'engine/core/core.js';

import { loadResources } from 'engine/loaders/resources.js';
import { GLTFLoader } from 'engine/loaders/GLTFLoader.js';
import { ImageLoader } from 'engine/loaders/ImageLoader.js';

import { AnimationSystem } from 'engine/animators/AnimationSystem.js'
import { Animator } from 'engine/animators/Animator.js'

import { mat4, vec3, quat } from 'glm';

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

const skyboxResources = await loadResources({
    mesh: new URL('../../../models/cube/cube.json', import.meta.url),
    px: new URL('../../../models/space/vesolje10.png', import.meta.url),
    nx: new URL('../../../models/space/vesolje10.png', import.meta.url),
    py: new URL('../../../models/space/vesolje10.png', import.meta.url),
    ny: new URL('../../../models/space/vesolje10.png', import.meta.url),
    pz: new URL('../../../models/space/vesolje10.png', import.meta.url),
    nz: new URL('../../../models/space/vesolje10.png', import.meta.url),
});


const canvas = document.querySelector('canvas');
const skyboxRenderer = new SkyBoxRenderer(canvas);
await skyboxRenderer.initialize();

// Set the environment (six cube faces) on the renderer. Convert images to ImageBitmap for reliable upload.
const skyFaces = [
    skyboxResources.px,
    skyboxResources.nx,
    skyboxResources.py,
    skyboxResources.ny,
    skyboxResources.pz,
    skyboxResources.nz,
];
// Crop each face to a centered square to satisfy cube texture requirements (width === height)
const environmentImages = await Promise.all(skyFaces.map(async (img) => {
    // ensure we have an ImageBitmap for consistent dimensions
    const src = img instanceof ImageBitmap ? img : img;
    const w = src.width;
    const h = src.height;
    const size = Math.min(w, h);
    const sx = Math.floor((w - size) / 2);
    const sy = Math.floor((h - size) / 2);
    // createImageBitmap supports cropping from HTMLImageElement or ImageBitmap
    return await createImageBitmap(src, sx, sy, size, size);
}));
skyboxRenderer.setEnvironment(environmentImages);

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
camera.addComponent(new Transform({translation : [0, 5, 0]}));
camera.addComponent(new Camera());
camera.addComponent(new TouchController(camera, canvas, {
    distance: 5,
}));
/*
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
*/
// we use the renderer's built-in environment skybox; do not add a cube-entity to the scene

//load textures for and earth
const imgLoader = new ImageLoader();
const greenImg = await imgLoader.load(new URL('./models/zemlja/green.jpg', import.meta.url))
const blueImg = await imgLoader.load(new URL('./models/zemlja/blue.jpg', import.meta.url))
const moonImg = await imgLoader.load(new URL('./models/zemlja/moonImg.jpg', import.meta.url))

//importing sonce
let loader = new GLTFLoader();
await loader.load(new URL('./models/sonce/sonce2.gltf', import.meta.url));
const sonce = loader.loadScene()[0];
const sonceTransform = sonce.getComponentOfType(Transform);
sonceTransform.translation = [2, -2, 0];

loader = new GLTFLoader();
await loader.load(new URL('./models/zemlja/zemlja-proto.gltf', import.meta.url));
const zemlja = loader.loadScene()[1];
const luna = loader.loadScene()[2];
luna.addComponent(new Parent(zemlja));
console.log(zemlja);
console.log(sonce);


//adding texture image to sun and earth
const zemljaModel = zemlja.getComponentOfType(Model);
zemljaModel.primitives[1].material.baseTexture = new Texture({
                    image: greenImg,
                    sampler: new Sampler({
                        minFilter: 'linear',
                        magFilter: 'linear',
                        addressModeU: 'clamp-to-edge',
                        addressModeV: 'clamp-to-edge',
                    })});

zemljaModel.primitives[0].material.baseTexture = new Texture({
                    image: blueImg,
                    sampler: new Sampler({
                        minFilter: 'linear',
                        magFilter: 'linear',
                        addressModeU: 'clamp-to-edge',
                        addressModeV: 'clamp-to-edge',
                    })});


const lunaModel = luna.getComponentOfType(Model);
lunaModel.primitives[0].material.baseTexture = new Texture({
                    image: moonImg,
                    sampler: new Sampler({
                        minFilter: 'linear',
                        magFilter: 'linear',
                        addressModeU: 'clamp-to-edge',
                        addressModeV: 'clamp-to-edge',
                    })});


//transforming objects in the scene
const zemljaTransform = zemlja.getComponentOfType(Transform);
const lunaTransform = luna.getComponentOfType(Transform);
lunaTransform.translation = [0.15, 0.15, -0.2];
lunaTransform.scale = [0.5, 0.5, 0.5];
zemljaTransform.translation = [-2, -0.4, 0.2];

//loading animated test object
loader = new GLTFLoader();
await loader.load(new URL('./models/testAnim2/player.gltf', import.meta.url));
const loadedScene = loader.loadScene();
const playerArmature = loadedScene[0];
const player = playerArmature.children[0]; //actual mesh
const playerModel = player.getComponentOfType(Model);

//animating player
const parsedAnimations = loader.loadAnimation(0, playerModel.skin);
player.addComponent(new Animator(parsedAnimations));
player.getComponentOfType(Animator).play(0);

//transforming player
const playerTransform = playerArmature.getComponentOfType(Transform);
playerTransform.scale = [0.3, 0.3, 0.3];
playerTransform.translation = [0, 0, 0];
const rotQuat = quat.create();
quat.setAxisAngle(rotQuat, [0, 1, 0], -Math.PI/2);
playerTransform.rotation = rotQuat;

//final scene
const scene = [camera, sonce, zemlja, luna, player];

const light = new Entity();
light.addComponent(new Light({
    direction: [-1, 1, 1],
}));
scene.push(light);

//creating AnimationSystem
const animSystem = new AnimationSystem();

function update(time, dt) {
    for (const entity of scene) {
        for (const component of entity.components) {
            component.update?.(time, dt);
        }
    }

    animSystem.update(scene, dt);
}

function render() {
    // The SkyBoxRenderer handles model drawing and the skybox in a single pass.
    skyboxRenderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

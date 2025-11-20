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
import { Physics } from 'engine/core/Physics.js';
import { calculateAxisAlignedBoundingBox, mergeAxisAlignedBoundingBoxes, } from 'engine/core/MeshUtils.js';

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

//importing zemlja
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
zemljaTransform.translation = [2, 0.65, 0.2];

//loading animated test object
loader = new GLTFLoader();
await loader.load(new URL('./models/sunAnimated2/animatedSun.gltf', import.meta.url));
const loadedScene = loader.loadScene();
const playerArmature = loadedScene[0];
playerArmature.printTree();
const player = playerArmature.children[0]; //actual mesh
const playerModel = player.getComponentOfType(Model);

//loading animation and binding them to player
const idleAnim = loader.loadAnimation("idle", playerModel.skin);
const punchAnim = loader.loadAnimation("shortPunch", playerModel.skin);
const stepForwardAnim = loader.loadAnimation("stepForwardFast", playerModel.skin);
const stepBackAnim = loader.loadAnimation("stepBackFast", playerModel.skin);
const jumpAnim = loader.loadAnimation("jump", playerModel.skin);
player.addComponent(new Animator([idleAnim, punchAnim, stepForwardAnim, stepBackAnim, jumpAnim]));


//transforming player
const playerTransform = playerArmature.getComponentOfType(Transform);
// playerTransform.scale = [0.3, 0.3, 0.3];
playerTransform.translation = [0, -1, 0];
const rotQuat1 = quat.create();
const rotQuat2 = quat.create();
quat.setAxisAngle(rotQuat1, [1, 0, 0], Math.PI/2);
quat.setAxisAngle(rotQuat2, [0, 1, 0], Math.PI/2);
const finalQuat = quat.create();
quat.multiply(finalQuat, rotQuat2, rotQuat1);
playerTransform.rotation = finalQuat;

//final scene
const scene = [camera, zemlja, luna, player];

const light = new Entity();
light.addComponent(new Light({
    direction: [-1, 1, 1],
}));
scene.push(light);

//adding collision detection (Physics.js file)
const physics = new Physics(scene);
for (const entity of scene) {
    const model = entity.getComponentOfType(Model);
    if (!model) {
        continue;
    }

    const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
    console.log(boxes);
    entity.aabb = mergeAxisAlignedBoundingBoxes(boxes);
    console.log(entity.aabb);
}
const ma = vec3.fromValues(1.0, 1.0, 1.0);
const mi = vec3.fromValues(-1.0, -1.0, -1.0);
player.aabb = {max:ma, min:mi};
zemlja.aabb = {max:ma, min:mi};

//defining static/non static objects
player.customProperties = {isDynamic: true, isStatic: false}; 
zemlja.customProperties = {isDynamic: false, isStatic: true};

//creating AnimationSystem
const animSystem = new AnimationSystem();

function update(time, dt) {
    for (const entity of scene) {
        for (const component of entity.components) {
            component.update?.(time, dt);
        }
    }

    physics.update(time, dt);
    animSystem.update(scene, dt);
}


//-------------------------------------------------------------------EVENT LISTENERS and USER INPUT-----------------------------------------------------------------------
let keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);


//--------------------------------------------------------------------PLAYER'S UPDATE METHOD--------------------------------------------------------------------------------
let moveOnce = true;
const playerAnimator = player.getComponentOfType(Animator);
let velocity = 1.0;
let gravity = 40.0;
let initVelY = (gravity*0.49999995231628414)/2;
let velocityY = initVelY;

player.addComponent({
    update(t, dt){
        if (keys.d){
            if (moveOnce){
                playerAnimator.play(2);
                // let pos = playerTransform.translation;
                // playerTransform.translation = [pos[0]+1, pos[1], pos[2]];
                moveOnce = false;
            }  
        }

        if (keys.a){
            if (moveOnce){
                playerAnimator.play(3);
                moveOnce = false;
            }
        }

        if (keys.w){
            velocityY = initVelY;
            if (moveOnce){
                playerAnimator.play(4);
                moveOnce = false;
            }
        }

        if (playerAnimator.playingAnim == 2){
            playerTransform.translation[0] += velocity * dt;
        }

        if (playerAnimator.playingAnim == 3){
            playerTransform.translation[0] += -velocity * dt;
        }

        if (playerAnimator.playingAnim == 4 && playerAnimator.time > 0.4 && playerAnimator.time < playerAnimator.animLen - 0.4){
            velocityY -= gravity*dt;
            playerTransform.translation[1] += velocityY*dt;
        }


        if (keys.r){
            playerAnimator.play(1);
            
        }

        if (!playerAnimator.playing){
            moveOnce = true;
            playerAnimator.play(0);
        }

    }
});

function render() {
    // The SkyBoxRenderer handles model drawing and the skybox in a single pass.
    skyboxRenderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

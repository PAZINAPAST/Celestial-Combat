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

const cube1Resources = await loadResources({
    mesh: new URL('../../../models/cube/cube.json', import.meta.url),
    image: new URL('../../../models/cube/cube-diffuse.png', import.meta.url),
})

const cube2 = new Entity([], "Box");
cube2.addComponent(new Transform({
    translation: [0, 0, 0],
    scale: [1, 1, 1],
    rotation: [0, 0, 0, 1],
}));

cube2.addComponent(new Model({
    primitives:[
        new Primitive({
            mesh: cube1Resources.mesh,
            material: new Material({
                baseTexture: new Texture({
                    image: cube1Resources.image,
                    sampler: new Sampler({
                        minFilter: 'nearest',
                        magFilter: 'nearest',
                        addressModeU: 'repeat',
                        addressModeV: 'repeat'
                    })
                })
            })
        })
    ]
}));
cube2.customProperties = {isDynamic: true, isStatic: false};
const cubeTransform = cube2.getComponentOfType(Transform);
cubeTransform.scale = [0.5, 2, 0.5];

//importing sonce
let loader = new GLTFLoader();
await loader.load(new URL('./models/sonce/sonce2.gltf', import.meta.url));
const sonce = loader.loadScene()[0];
const sonceTransform = sonce.getComponentOfType(Transform);
sonceTransform.translation = [2, -2, 0];


//-------------------------------------ANIMATED PLAYER--------------------------------------------------------
//loading animated test object
loader = new GLTFLoader();
await loader.load(new URL('./models/sunAnimated3/animatedSun3.gltf', import.meta.url));
const loadedScene = loader.loadScene();
console.log(loadedScene);
const playerArmature = loadedScene[0];
console.log("Player Armature: " + playerArmature);
playerArmature.printTree();
const player = playerArmature.children[0]; //actual mesh
console.log("Player : " + player);
const playerModel = player.getComponentOfType(Model);
console.log("Player model: " + playerModel);


//loading animation and binding them to player
const idleAnim = loader.loadAnimation("idle", playerModel.skin);
const punchAnim = loader.loadAnimation("punchBlended", playerModel.skin);
const stepForwardAnim = loader.loadAnimation("stepForwardBlended", playerModel.skin);
const stepBackAnim = loader.loadAnimation("stepBackBlended", playerModel.skin);
const jumpAnim = loader.loadAnimation("jumpBlended", playerModel.skin);
player.addComponent(new Animator([idleAnim, punchAnim, stepForwardAnim, stepBackAnim, jumpAnim]));  //dodajanje vseh animacij v player-ja

player.isAnimated = true;

//loading zemlja animated
loader = new GLTFLoader();
await loader.load(new URL('./models/zemlja/zemljaAnimation.gltf', import.meta.url));
const loadedSceneZemlja = loader.loadScene();
console.log(loadedSceneZemlja);
const zemljaArmature = loadedSceneZemlja[1];
console.log("Zemlja Armature: " + zemljaArmature);
zemljaArmature.printTree();
const npcZemlja = zemljaArmature.children.find(c => c.name == "earth"); //actual mesh
const npcLuna = zemljaArmature.children[1];
console.log("Zemlja NPC: " + npcZemlja);
const npcZemljaModel = npcZemlja.getComponentOfType(Model);
//const ncpLunaModel = npcLuna.getComponentOfType(Model);
console.log("Zemlja model: " + npcZemljaModel);

//loading animation and binding them to npcZemlja
const zemljaIdleAnim = loader.loadAnimation("Idle", npcZemljaModel.skin);
const zemljaHitAnim = loader.loadAnimation("Hit", npcZemljaModel.skin);
npcZemlja.addComponent(new Animator([zemljaIdleAnim, zemljaHitAnim]));
npcZemlja.isAnimated = true;

console.log(playerArmature);

//transforming player
const playerTransform = playerArmature.getComponentOfType(Transform);
playerTransform.translation = [-2, -1, 0];
const rotQuat1 = quat.create();
const rotQuat2 = quat.create();
quat.setAxisAngle(rotQuat1, [1, 0, 0], Math.PI/2);
quat.setAxisAngle(rotQuat2, [0, 1, 0], Math.PI/2);
const finalQuat = quat.create();
quat.multiply(finalQuat, rotQuat2, rotQuat1);
playerTransform.rotation = finalQuat;

npcZemlja.isAnimated = true;
//----------------------------------------------------------------------------------------------------------------------


//transforming npcZemlja
const npcZemljaTransform = zemljaArmature.getComponentOfType(Transform);
npcZemljaTransform.translation = [2, -1, 0];
const zRotQuat1 = quat.create();
const zRotQuat2 = quat.create();
quat.setAxisAngle(zRotQuat1, [1, 0, 0], Math.PI/2);
quat.setAxisAngle(zRotQuat2, [0, 1, 0], -Math.PI/2);
const zFinalQuat = quat.create();
quat.multiply(zFinalQuat, zRotQuat2, zRotQuat1);
npcZemljaTransform.rotation = zFinalQuat;

//final scene
const scene = [camera, npcZemlja, npcLuna , player, /*cube2*/];

const light = new Entity();
light.addComponent(new Light({
    direction: [-1, 1, 1],
}));
scene.push(light);

//adding collision detection - bounding box around each object (Physics.js file) 

const physics = new Physics(scene);

for (const entity of scene) {
    const model = entity.getComponentOfType(Model);
    console.log("Entity: " + entity.name + " Model: " + model);
    if (!model) {
        continue;
    }

    const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));

    // if (entity.isAnimated){
    //     const parentEntity = entity.getComponentOfType(Parent).entity;
    //     parentEntity.aabb = mergeAxisAlignedBoundingBoxes(boxes);
    //     entity.aabb = mergeAxisAlignedBoundingBoxes(boxes);

    // } else{
        entity.aabb = mergeAxisAlignedBoundingBoxes(boxes);
    //}
    
}


//defining static/non static objects
player.customProperties = {isDynamic: true, isStatic: false}; 
npcZemlja.customProperties = {isDynamic: false, isStatic: true};
// zemlja.customProperties = {isDynamic: false, isStatic: true};
// zemlja.customProperties = {isDynamic: false, isStatic: true};


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


//--------- Character stats and health bars ----------------------------------------------------------------
let maxHealth = 100;
let healthPlayer = 100;
let healthZemlja = 100;

//------------------------------------------------- Starting and end screen -------------------------------------------------------------------------------------
const startScreen = document.getElementById("start-screen");
const endScreen = document.getElementById("game-over-screen");
const endMessage = document.getElementById("gameover-message");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

let gameRunning = false;

startButton.addEventListener("click", () => {
    startScreen.classList.add("hidden");
    gameRunning = true;
    playerTransform.translation = [-2, -1, 0];
    npcZemljaTransform.translation = [2, -1, 0];
    healthPlayer = maxHealth;
    healthZemlja = maxHealth;
    updateHealthBars("player-health-bar", healthPlayer, maxHealth);
    updateHealthBars("npcZemlja-health-bar", healthZemlja, maxHealth);
});

restartButton.addEventListener("click", () => {
    endScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
    gameRunning = false;
});

function checkGameOver(){
    if (healthPlayer <= 0){
        gameRunning = false;
        endMessage.textContent = "You lose!";
        endScreen.classList.remove("hidden");
    } else if(healthZemlja <= 0){
        gameRunning = false;
        endMessage.textContent = "You win!"
        endScreen.classList.remove("hidden");
    }
}

//--------------------------------------------------------------------PLAYER'S UPDATE METHOD--------------------------------------------------------------------------------
let moveOnce = true;
let alreadyHit = false;
const playerAnimator = player.getComponentOfType(Animator);
const zemljaAnimator = npcZemlja.getComponentOfType(Animator);
let velocityLR = 2.0;
let gravity = 50.0;
let attacking = false;
let grounded = true;
let initVelY = (gravity*(1.1333333253860474-2*0.3))/2; //ta cifra je dolzina skoka v sekundah (animLen - 2*odmik)
let velocityY = initVelY;
const hitRange = 1.1;

function updateHealthBars(id, health, maxHealth){
    const bar = document.getElementById(id);
    const percent = Math.max(0, (health / maxHealth) * 100);
    bar.style.setProperty('--health', percent + '%');
}

player.addComponent({
    update(t, dt){
        const s = playerTransform.translation;
        const z = npcZemljaTransform.translation;
        const razlika = s[0] - z[0];

    
        if (keys.t){
            npcZemljaTransform.translation[0] -= dt;
        }
        if (keys.y){
            npcZemljaTransform.translation[0] += dt;
        }
        //moving right
        if (keys.d && attacking == false){
            playerTransform.translation[0] += velocityLR * dt;
            if (moveOnce){
                playerAnimator.play(2);
                moveOnce = false;

                //const s = playerTransform.translation;
                //const z = zemljaTransform.translation;
                //console.log(s);
                //console.log(z);
            }  
            
        }

        //moving left
        if (keys.a && attacking == false){
            playerTransform.translation[0] += -velocityLR * dt;
            if (moveOnce){
                playerAnimator.play(3);
                moveOnce = false;
            }
        }

        //jumping (playing animation)
        if (keys.w && attacking == false){
            if (grounded){
                velocityY = initVelY; //ta stvar triggera premikanje v vertikalni smeri
                playerAnimator.play(4);
                grounded = false;
            }
        }

        //jumping (actually moving up-down)
        if (playerAnimator.playingAnim == 4 && playerAnimator.time > 0.3 && playerAnimator.time < playerAnimator.animLen - 0.3){
            velocityY -= gravity*dt;
            playerTransform.translation[1] += velocityY*dt;
        }

        //punch
        if (keys.r){
            if (grounded){
                playerAnimator.play(1);
                attacking = true;
                
            }

            if(Math.abs(razlika) < hitRange && !alreadyHit) {
                healthZemlja -= 10;
                alreadyHit = true;
                console.log("Zemlja hit! Health: " + healthZemlja);
                setTimeout(() => { 
                    zemljaAnimator.play(1);
                    updateHealthBars("npcZemlja-health-bar", healthZemlja, maxHealth);
                }, 500);
                checkGameOver();
            }

            
        }

        //reseting stuff | playing idle animation
        if (!playerAnimator.playing){
            moveOnce = true;
            grounded = true;    
            attacking = false;
            alreadyHit = false;

            console.log("grounded true");/*
            const s = playerTransform.translation;
            const z = zemljaTransform.translation;
            const razlika = s[0] - z[0];
            console.log(s);
            console.log(z);
            console.log(Math.abs(razlika));*/
            //console.log("popoppop");
            console.log("Zemlja health: " + healthZemlja);
            if (playerTransform.translation[1] != -1){
                console.log("correcting y-position");
                playerTransform.translation[1] = -1;
            } 
            if (!keys.a && !keys.d && !keys.w){ //zato da objekt ne gre za 1 frame v idle mode potem pa ze v nek movind animation ce drzimo nek gumb
                playerAnimator.play(0);
                //zemljaAnimator.play(0);
            }
            
        }


        if (!zemljaAnimator.playing){
            moveOnce = true;
            grounded = true;    
            attacking = false;
            alreadyHit = false;

            //console.log("grounded true");
            /*
            const s = playerTransform.translation;
            const z = zemljaTransform.translation;
            const razlika = s[0] - z[0];
            console.log(s);
            console.log(z);
            console.log(Math.abs(razlika));*/
            //console.log("popoppop");
            //console.log("Zemlja health: " + healthZemlja);
           /* if (playerTransform.translation[1] != -1){
                console.log("correcting y-position");
                playerTransform.translation[1] = -1;
            } */
            if (!keys.a && !keys.d && !keys.w){ //zato da objekt ne gre za 1 frame v idle mode potem pa ze v nek movind animation ce drzimo nek gumb
                //playerAnimator.play(0);
                zemljaAnimator.play(0);
            }
            
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

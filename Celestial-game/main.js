import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

//import { UnlitRenderer } from 'engine/renderers/UnlitRenderer.js';
import { SkyBoxRenderer } from 'engine/renderers/SkyBoxRenderer.js';
//import { TouchController } from 'engine/controllers/TouchController.js';

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
import { HitStopManager } from './engine/animators/HitStopManager.js';

import { mat4, vec3, quat } from 'glm';


const skyboxResources = await loadResources({
    mesh: new URL('../../../models/cube/cube.json', import.meta.url),
    px: new URL('../../../models/space/vesolje11flipped.png', import.meta.url),
    nx: new URL('../../../models/space/vesolje11flipped.png', import.meta.url),
    py: new URL('../../../models/space/vesolje11.png', import.meta.url),
    ny: new URL('../../../models/space/vesolje11.png', import.meta.url),
    pz: new URL('../../../models/space/vesolje11.png', import.meta.url),
    nz: new URL('../../../models/space/vesolje11.png', import.meta.url),
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


const camera = new Entity();
camera.addComponent(new Transform({translation : [0, 0, 5]}));
camera.addComponent(new Camera());
/*
camera.addComponent(new TouchController(camera, canvas, {
   distance: 5,
}));*/

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
                        minFilter: 'nearest',//nearest
                        magFilter: 'nearest',
                        addressModeU: 'repeat', //repeat
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


//-------------------------------------------------------ANIMATED SUN--------------------------------------------------------------------
//loading animated test object
loader = new GLTFLoader();
await loader.load(new URL('./models/sunAnimated13/animatedSun3.gltf', import.meta.url));
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
const punchBlended = loader.loadAnimation("punchBlended", playerModel.skin);
const stepForwardBlended = loader.loadAnimation("stepForwardBlended", playerModel.skin);
const stepBack = loader.loadAnimation("stepBack", playerModel.skin);
const stepBackBlended = loader.loadAnimation("stepBackBlended", playerModel.skin);
const jumpAnim = loader.loadAnimation("jumpBlended", playerModel.skin);
const hookPunchBlended = loader.loadAnimation("hookPunchBlended", playerModel.skin);
const block = loader.loadAnimation("blockBlended", playerModel.skin);
const kickBlended = loader.loadAnimation("kickBlended", playerModel.skin);
const hit = loader.loadAnimation("hitBlended", playerModel.skin);
const hitKnockback = loader.loadAnimation("hitStepBackBlended", playerModel.skin);
const startAnim = loader.loadAnimation("startAnimNoVerticalBlended", playerModel.skin);
const backflipAnim = loader.loadAnimation("backflip", playerModel.skin);
const frontFlipAnim = loader.loadAnimation("frontFlip", playerModel.skin);
const dyingDramatic = loader.loadAnimation("dyingDramatic", playerModel.skin);
player.addComponent(new Animator([idleAnim, punchBlended, stepForwardBlended, stepBackBlended, jumpAnim, hookPunchBlended, block, kickBlended, hit, hitKnockback, stepBack, startAnim, backflipAnim, frontFlipAnim, dyingDramatic]));  //dodajanje vseh animacij v player-ja

player.isAnimated = true;

//transforming player
const playerTransform = playerArmature.getComponentOfType(Transform);
playerTransform.translation = [-2, -1, 0];
let rotQuat1 = quat.create();
let rotQuat2 = quat.create();
quat.setAxisAngle(rotQuat1, [1, 0, 0], Math.PI/2);
quat.setAxisAngle(rotQuat2, [0, 1, 0], Math.PI/2);
const finalQuat = quat.create();
quat.multiply(finalQuat, rotQuat2, rotQuat1);
playerTransform.rotation = finalQuat;

console.log(playerArmature);

//-------------------------------------------------------ANIMATED EARTH--------------------------------------------------------------------
loader = new GLTFLoader();
await loader.load(new URL('./models/zemljaAnimated4/zemljaAnimated0.gltf', import.meta.url));
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
const zemljaIdleAnim = loader.loadAnimation("idle", npcZemljaModel.skin);
const zemljaHitAnim = loader.loadAnimation("hitBlended", npcZemljaModel.skin);
const zemljaStepForward = loader.loadAnimation("stepForwardBlended", npcZemljaModel.skin);
const zemljaStepBack = loader.loadAnimation("stepBackBlended", npcZemljaModel.skin);
const zemljaJump = loader.loadAnimation("jumpBlended", npcZemljaModel.skin);
const zemljaBlock = loader.loadAnimation("blockBlended", npcZemljaModel.skin);
const zemljaPunchAnim = loader.loadAnimation("punchBlended", npcZemljaModel.skin);
const zemljaHookPunch = loader.loadAnimation("hookPunchBlended", npcZemljaModel.skin);
const zemljaKick = loader.loadAnimation("kickBlended", npcZemljaModel.skin);
const zemljaHitKnockback = loader.loadAnimation("hitStepBackBlended", npcZemljaModel.skin);
const zemljaStartAnim = loader.loadAnimation("startAnimBlended", npcZemljaModel.skin);
const zemljaDyingDramatic = loader.loadAnimation("dyingDramatic", npcZemljaModel.skin);

npcZemlja.addComponent(new Animator([zemljaIdleAnim, zemljaHitAnim, zemljaStepForward, zemljaStepBack, zemljaJump, zemljaBlock, zemljaPunchAnim, zemljaHookPunch, zemljaKick, zemljaHitKnockback, zemljaStartAnim, zemljaDyingDramatic]));
npcZemlja.isAnimated = true;

npcZemlja.isAnimated = true;

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
//----------------------------------------------------------------------------------------------------------------------------------

//adding game manager
const gameManager = new Entity([], "gameManager");


//final scene
const scene = [camera, npcZemlja, npcLuna , player, gameManager/*cube2*/];

const light = new Entity();
light.addComponent(new Light({
    direction: [0, 0, -1]/*[-20, 0, -10],*/   //gor-dol, levo-desno, spredaj-zadaj
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

//--------------------------------------------------------------------SOUND INTIALIZATION---------------------------------------------------------------------------------
const punchSound = new Audio('./sounds/punch.mp3');
const superPunchSound = new Audio('./sounds/super_punch.mp3');
const kickSound = new Audio('./sounds/kick.mp3');
const blockSound = new Audio('./sounds/block.mp3');
const punchMissSound = new Audio('./sounds/punchMiss.mp3');
const superMissSound = new Audio('./sounds/superMiss.mp3');
const kickMissSound = new Audio('./sounds/kickMiss.mp3');
const loseSound = new Audio('./sounds/lose_sound.mp3');
const winSound = new Audio('./sounds/win_sound.mp3');
const backgroundSound = new Audio('./sounds/backround.mp3');
const fightSound = document.getElementById("fight-sound");

punchSound.preload = 'auto';
superPunchSound.preload = 'auto';
kickSound.preload = 'auto';
blockSound.preload = 'auto';
punchMissSound.preload = 'auto';
superMissSound.preload = 'auto';
kickMissSound.preload = 'auto';
loseSound.preload = 'auto';
winSound.preload = 'auto';
backgroundSound.preload = 'auto';
fightSound.preload = 'auto';

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
const controlsPopup = document.getElementById("controls-popup");
const closePopup = document.getElementById("close-popup");
const fightOverlay = document.getElementById("fight-overlay");

let gameRunning = false;
let gravity = 20.0;
let initVelY = 0;
const playerInitHeight = 0.6*0.6*0.5*gravity;



startButton.addEventListener("click", () => {
    startScreen.classList.add("hidden");
    controlsPopup.classList.add("active"); 

    backgroundSound.volume = 0.1;
    backgroundSound.play();

    closePopup.addEventListener("click", closeControlsPopup);


    document.addEventListener("keydown", (event) => {
        if (controlsPopup.classList.contains("active")) {
            closeControlsPopup();
        }
    });
});


//------------------------------------------------------------START GAME PROCEDURE------------------------------------------------------------------
function startActualGame() {
    playerTransform.translation = [-2, playerInitHeight, 0];
    npcZemljaTransform.translation = [2, playerInitHeight, 0];
    healthPlayer = maxHealth;
    healthZemlja = maxHealth;
    updateHealthBars("player-health-bar", healthPlayer, maxHealth);
    updateHealthBars("npcZemlja-health-bar", healthZemlja, maxHealth);

    velocityY = 0;
    zemljaVelocity = 0;
    gravity = 20.0;

    //setTimeout(() => {
        playerAnimator.play(11);
        zemljaAnimator.play(10);
    //}, 500);       //predvajaj start animacijo z zamikom
    
    setTimeout(() =>{   //nastavi gameRunning z delayom (pocakaj tako dolgo da se starting animation predvaja do konca)
        fightOverlay.classList.add("active");

        fightSound.currentTime = 0;
        fightSound.play();

        setTimeout(() => {
            fightOverlay.classList.remove("active");
            gameRunning = true;
            console.log("fight");
        }, 2000);

        
    }, 3400);
}
//---------------------------------------------------------------STOP SCREEN-------------------------------------------------------------------------------

restartButton.addEventListener("click", () => {
    backgroundSound.pause();
    endScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
    backgroundSound.scrollTop()
    
    gameRunning = false;    //ustavi igro dokler je stop screen
});


//------------------------------------------------------------GAME OVER PROCEDURE--------------------------------------------------------------------
function checkGameOver(){
    if (healthPlayer <= 0){
        gameRunning = false;
        playerAnimator.play(14);
        loseSound.currentTime = 0;
        loseSound.volume = 0.2;
        loseSound.play();
        setTimeout(()=>{
            endMessage.textContent = "You lose!";
            endScreen.classList.remove("hidden");
        }, 2500);
        
    } else if(healthZemlja <= 0){
        gameRunning = false;
        zemljaAnimator.play(11);
        winSound.currentTime = 0;
        winSound.volume = 0.2;
        winSound.play();
        setTimeout(()=>{
            endMessage.textContent = "You win!";
            endScreen.classList.remove("hidden");
        }, 2500);
    }
}
//-----------------------------------------------------------------CONTROLS POP-UP---------------------------------------------------------------------------------


function closeControlsPopup() {
    controlsPopup.classList.remove("active"); 

    setTimeout(() => {
        startActualGame();
    }, 600);
}

//--------------------------------------------------------------------GAME MANAGER---------------------------------------------------------------------------------------------
let playerLeft = true;
rotQuat1 = quat.create();
rotQuat2 = quat.create();
let rotQuat3 = quat.create();
quat.setAxisAngle(rotQuat1, [1, 0, 0], Math.PI/2);
quat.setAxisAngle(rotQuat2, [0, 1, 0], Math.PI/2); //facing right
quat.setAxisAngle(rotQuat3, [0, 1, 0], -Math.PI/2); //facing left
let faceLeft = quat.create();
let faceRight = quat.create();
faceRight = quat.multiply(faceRight, rotQuat2, rotQuat1);
faceLeft = quat.multiply(faceLeft, rotQuat3, rotQuat1);

let sunPosBefore = playerTransform.translation[0];
let earthPosBefore = npcZemljaTransform.translation[0];
let rotationalCoefcient = 1;

gameManager.addComponent({
    update(t, dt){

        //---------------------------------------OBRACANJE IGRALCEV-------------------------------------------------------------
        //player je na levi strani
        if (grounded){    //orientacijo spremenimo samo, ce sta oba na tleh  (v nasprotne primeru se animacija front flip zelo grdo izvede)

            if (playerTransform.translation[0] < npcZemljaTransform.translation[0]){
                rotationalCoefcient = 1;
                playerTransform.rotation = faceRight;
                npcZemljaTransform.rotation = faceLeft;

            } else{ //player je na desni
                rotationalCoefcient = -1;
                playerTransform.rotation = faceLeft;
                npcZemljaTransform.rotation = faceRight;
            }
        }
        
        //---------------------------------------POPRAVEK NA Z-OSI-------------------------------------------------------------
        //ce se zgodi da sonce ali zemlja nista na z = 0, potem popravi (te se for some reason lahko zgodi ko hoce player skociti cez zemljo)
        if (playerTransform.translation[2] != 0) {playerTransform.translation[2] = 0}
        if (npcZemljaTransform.translation[2] != 0) {npcZemljaTransform.translation[2] = 0}

        //---------------------------------------PREDVAJANJE ANIMACIJE NA ZACETKU-------------------------------------------------------------
        //delovanje gravitacije na pri predvajanju startAnimation
        if (playerAnimator.playingAnim == 11 || zemljaAnimator.playingAnim == 10){
            velocityY -= gravity*dt;
            zemljaVelocity -= gravity*dt;
            playerTransform.translation[1] += velocityY*dt;
            npcZemljaTransform.translation[1] += zemljaVelocity*dt;

            //zakljuci animacijo ko prides na tla
            if (playerTransform.translation[1] < -1){
                playerTransform.translation[1] = -1;
            }
            if (npcZemljaTransform.translation[1] < -1){
                npcZemljaTransform.translation[1] = -1;
            }
        }


        hitStop.update(dt);
        if(hitStop.active) {
            return;
        }

        if(npcZemljaTransform.translation[0] <= -4.5) {
            npcZemljaTransform.translation[0] = -4.5;
        }

        if(npcZemljaTransform.translation[0] >= 4.5) {
            npcZemljaTransform.translation[0] = 4.5;
        }

        if(playerTransform.translation[0] <= -4.5) {
            playerTransform.translation[0] = -4.5;
        }

        if(playerTransform.translation[0] >= 4.5) {
            playerTransform.translation[0] = 4.5;
        }
    }
})

//--------------------------------------------------------------------PLAYER'S UPDATE METHOD--------------------------------------------------------------------------------
let moveOnce = true;
let moveOnceZemlja = true;
let alreadyHitSonce = false;
let alreadyHitZemlja = false;
const playerAnimator = player.getComponentOfType(Animator);
const zemljaAnimator = npcZemlja.getComponentOfType(Animator);
let velocityLR = 2.5;
let sonceHit = false;

let attacking = false;
let grounded = true;
let blocking = false;

let velocityY = initVelY;
const hitRange = 1.4;
const kickRange = 1.8;
let playerGetKicked = false;
let playerGetSuperPunched = false;
let playerGetPunched = false;
let freezetimer = 0;

// zemlja variables
let soundAlreadyPlayed = false;
let zemljaMoveOnce = true;
let decisionTimer = 0;
let zemljaAction = "idle";
let zemljaAttacking = false;
let zemljaBlocking = false;
let zemljaJumping = false;
let zemljaVelocity = initVelY;      //hitrost zemlje v vertikalni smeri
let zemljaPremik = 2.5;             //hitrost zemlje levo-desno
let zemljaGravity = 70;
let zemljaInitVelY = (zemljaGravity*(1.1333333253860474-2*0.3))/2;    //ta cifra je dolzina skoka v sekundah (animLen - 2*odmik)

//hitstopManager
const hitStop = new HitStopManager();
hitStop.addTarget(playerAnimator);
hitStop.addTarget(zemljaAnimator); 

function updateHealthBars(id, health, maxHealth){
    const bar = document.getElementById(id);
    const percent = Math.max(0, (health / maxHealth) * 100);
    bar.style.setProperty('--health', percent + '%');
}



let i = 2;
let zemljaPlaying = false;
let startedPlaying = false;

//object v katerem shranimo, ali smo spustili tipko za nek udarec, potem ko smo jo pritisnili
//s tem mehanizmom preprecimo da bi drzali gumb in bi se udarec predvajal znova in znova
const playerAttackReset = {
    punch: true,
    hook: true,
    kick: true,
    block: true,
    moveR: true,
    moveL: true,
}
let rawDir = 0;  //-1 pomeni levo, 1 pomeni desno
let dir = 0; //dejanska smer ki vkljucuje se rotationalCoef

let punchDamage = 5;
let hookDamage = 15;
let kickDamage = 10;

player.addComponent({
    update(t, dt){
        if(!gameRunning) {
            return;
        }

        rawDir = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
        dir = rawDir * rotationalCoefcient;
        
        /*
        hitStop.update(dt);
        if(hitStop.active) {
            return;
        }*/

        const s = playerTransform.translation;
        const z = npcZemljaTransform.translation;
        const razlika = s[0] - z[0];
        //console.log("payer animation playing: "+ playerAnimator.playing);

        //premik naprej pri navadnem punch-u
        if(attacking && playerAnimator.playingAnim == 1) {
           if(playerAnimator.time > 0 && playerAnimator.time < playerAnimator.animLen-0.4) {
                playerTransform.translation[0] += velocityLR * dt * rotationalCoefcient;
            }
        }

        if(playerGetKicked && playerAnimator.playingAnim == 9) {
            if (playerAnimator.time > 0.2 && playerAnimator.time < playerAnimator.animLen - 1) {
                playerTransform.translation[0] -= velocityLR * dt * rotationalCoefcient;
            }
        }

        if(playerGetSuperPunched && playerAnimator.playingAnim == 8) {
            //playerTransform.translation[0] -= velocityLR * dt * rotationalCoefcient;
        }

        if(!playerAnimator.playing && playerGetKicked) {
            playerGetKicked = false;
        }

        if(!playerAnimator.playing && playerGetSuperPunched) {
            playerGetSuperPunched = false;
        }
        /*
        if (keys.t){
            npcZemljaTransform.translation[0] -= velocityLR*dt;
        }
        if (keys.y){
            npcZemljaTransform.translation[0] += velocityLR*dt;
        }*/
        if(!sonceHit) {
        //moving right---------------------------------------------------------------
        if (dir == 1  && !attacking && !blocking && grounded){
            playerTransform.translation[0] += velocityLR * dt * rotationalCoefcient;
            if (moveOnce && grounded){
                playerAnimator.play(2);     //predvajaj anim za korak v desno
                moveOnce = false;
            }  
            
        }

        //moving left---------------------------------------------------------------
        if (dir == -1  && !attacking && !blocking && grounded){
            playerTransform.translation[0] += -velocityLR * dt * rotationalCoefcient;
            if (moveOnce && grounded && playerAttackReset.moveL){
                playerAnimator.play(3);     //predvajaj animacijo za korak v levo
                moveOnce = false;
            }
        }

        //back-flip---------------------------------------------------------------------------------
        if (keys.w && dir == -1 && grounded && !attacking && !blocking){
            gravity = 70;
            initVelY = (gravity*(0.65/1.5))/2
            velocityY = initVelY;
            playerAnimator.playFast(12, 1.5);
            grounded = false;
            //attacking = true;
        }
        
        if (playerAnimator.playing && playerAnimator.playingAnim == 12 && playerAnimator.time >= 0.67 && playerAnimator.time < 1.37){
            velocityY -= gravity*dt;
            playerTransform.translation[1] += velocityY*dt;     //premik gor-dol
            if (playerAnimator.time > 0.71){
                playerTransform.translation[0] -= velocityLR*dt*2.1*rotationalCoefcient;    //premik levo-desno //vecji kot je faktor vmes, dlje se premakne v zraku
            }
            
            if (playerTransform.translation[1] <= -1){
                //console.log("correcting y-position");
                playerTransform.translation[1] = -1;
            }
        }

        //front-flip----------------------------------------------------------------------------------
        if (keys.w && dir == 1 && grounded && !attacking && !blocking){
            gravity = 20;
            initVelY = (gravity*(0.95))/2
            velocityY = initVelY;
            playerAnimator.playFast(13, 1.0);
            grounded = false;
            //attacking = true;
        }

        if (playerAnimator.playing && playerAnimator.playingAnim == 13){
            
            playerTransform.translation[0] += velocityLR*dt*0.7*rotationalCoefcient;    //premik levo-desno
            
            if (playerAnimator.time > 0.47 && playerAnimator.time < 1.467){
                velocityY -= gravity*dt;
                playerTransform.translation[0] += velocityLR*dt*0.9*rotationalCoefcient;    //v zraku gre hitreje levo-desno   //vecji kot je faktor vmes, dlje se premakne v zraku
                playerTransform.translation[1] += velocityY*dt;     //premik gor-dol
            }
            
            if (playerTransform.translation[1] <= -1){
                //console.log("correcting y-position");
                playerTransform.translation[1] = -1;
            }
        }


        //punch--------------------------------------------------------------------
        if (keys.e && !attacking){
            if (grounded && !attacking && playerAttackReset.punch){
                playerAnimator.play(1);
                attacking = true;
                playerAttackReset.punch = false;
                blockSound.currentTime = 0;
            }


            //console.log("zemljaBlock: " + zemljaBlocking);
            if(Math.abs(razlika) <= hitRange && grounded) {
                setTimeout(() => {
                    hitStop.trigger(0.1);
                },220);
            } else {
                //blockSound.play();
                punchMissSound.currentTime = 0;
                punchMissSound.play();
            }

            if(Math.abs(razlika) <= hitRange && zemljaBlocking) {
                blockSound.play();
            }

            if(Math.abs(razlika) <= hitRange && !alreadyHitZemlja && !zemljaBlocking && grounded) {

                healthZemlja -= punchDamage;
                alreadyHitZemlja = true;
                zemljaBlocking = false;
                console.log("Zemlja hit! Health: " + healthZemlja);
                punchSound.currentTime = 0;
                
                

                setTimeout(() => {  //ce je hit registriran potem predvajaj hit animacijo in zmanjsaj health
                    //hitStop.trigger(0.1);
                    checkGameOver();    //to mora biti obvezno pred spodnjo funkcijo, zato da se hit animacije ne izvede ce je konec igre

                    if (gameRunning){zemljaAnimator.play(1);}
                    punchSound.play();
                    updateHealthBars("npcZemlja-health-bar", healthZemlja, maxHealth);
                    if(npcZemljaTransform.translation[1] != -1) {
                        npcZemljaTransform.translation[1] = -1;
                    }
                    freezetimer = 1;
                }, 50);


            }

        }

        if (!keys.e){playerAttackReset.punch = true;}
        

        //hook punch----------------------------------------------------------------------
        if (keys.r && !attacking){
            if (grounded && !attacking && playerAttackReset.hook){
                playerAnimator.play(5);
                attacking = true;
                playerAttackReset.hook = false;
                superPunchSound.currentTime = 0;
                blockSound.currentTime = 0;
            }

            if(Math.abs(razlika) <= hitRange && grounded) {
                //blockSound.play();
                setTimeout(() => {
                    hitStop.trigger(0.1);
                },800);
            } else {
                //blockSound.play();
                superMissSound.currentTime = 0;
                superMissSound.play();
            }

            if(Math.abs(razlika) <= hitRange && zemljaBlocking) {
                blockSound.play();
            }


            if(Math.abs(razlika) <= hitRange && !alreadyHitZemlja && !zemljaBlocking && grounded) {
                healthZemlja -= hookDamage;
                alreadyHitZemlja = true;
                zemljaBlocking = false;
                console.log("Zemlja hit! Health: " + healthZemlja);
                
                setTimeout(() => { 
                    //hitStop.trigger(0.5);
                    checkGameOver();
                    if (gameRunning){zemljaAnimator.play(1);}
                    superPunchSound.play();
                    updateHealthBars("npcZemlja-health-bar", healthZemlja, maxHealth);
                    if(npcZemljaTransform.translation[1] != -1) {
                        npcZemljaTransform.translation[1] = -1;
                    }
                    freezetimer = 1;
                }, 500);

            }
        }
        if (!keys.r){playerAttackReset.hook = true;}

        //high kick--------------------------------------------------------------------------------
        if (keys.f && !attacking && playerAttackReset.kick){
            if (grounded){
                playerAnimator.play(7);
                attacking = true;
                playerAttackReset.kick = false;
                kickSound.currentTime = 0;
                blockSound.currentTime = 0;
            }

            if(Math.abs(razlika) <= kickRange && grounded) {
                //blockSound.play();
                setTimeout(() => {
                    hitStop.trigger(0.15);
                },600);
            } else {
                //blockSound.play();
                kickMissSound.currentTime = 0;
                kickMissSound.play();
            }

            if(Math.abs(razlika) <= kickRange && zemljaBlocking) {
                setTimeout(() => {
                    blockSound.play();
                }, 200);
                //blockSound.play();
            }

            if(Math.abs(razlika) <= kickRange && !alreadyHitZemlja && !zemljaBlocking && grounded) {
                healthZemlja -= kickDamage;
                alreadyHitZemlja = true;
                zemljaBlocking = false;
                console.log("Zemlja hit! Health: " + healthZemlja);
                

                //freezetimer = 5;
                setTimeout(() => { 
                    //hitStop.trigger(0.5);
                    checkGameOver();
                    if (gameRunning){zemljaAnimator.play(9);}
                    kickSound.play();
                    //freezetimer = 5;
                    updateHealthBars("npcZemlja-health-bar", healthZemlja, maxHealth);
                    if(npcZemljaTransform.translation[1] != -1) {
                        npcZemljaTransform.translation[1] = -1;
                    }
                    
                }, 400);

                
            }
        }
        if (!keys.f){playerAttackReset.kick = true;}

        //block-----------------------------------------------------------------------------------------
        if (keys.q){
            if (grounded && !blocking && playerAttackReset.block){
                playerAnimator.play(6);
                blocking = true;
                playerAttackReset.block = false;
            }
        }
        if (!keys.q){playerAttackReset.block = true;}

        }
        

        //reseting stuff | playing idle animation
        if (!playerAnimator.playing){
            moveOnce = true;
            grounded = true;       //a je to res v redu??
            attacking = false;
            alreadyHitZemlja = false;
            blocking = false;
            sonceHit = false;

            /*
            const s = playerTransform.translation;
            const z = zemljaTransform.translation;
            const razlika = s[0] - z[0];
            console.log(s);
            console.log(z);
            console.log(Math.abs(razlika));*/
            //console.log("popoppop");

            //console.log("Zemlja health: " + healthZemlja);

            if (!keys.a && !keys.d && !keys.w){ //zato da objekt ne gre za 1 frame v idle mode potem pa ze v nek movind animation ce drzimo nek gumb
                playerAnimator.play(0);
            }
            
        }
        /*
        //brezvezen test da vidim ce animacije za zemljo delajo
        if (keys.j){
            zemljaAnimator.play(5);
        }


        if (!zemljaAnimator.playing){
            moveOnce = true;
            grounded = true;    
            attacking = false;
            alreadyHit = false;
            blocking = false;

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
            } */ /*
            if (!keys.a && !keys.d && !keys.w){ //zato da objekt ne gre za 1 frame v idle mode potem pa ze v nek movind animation ce drzimo nek gumb
                //playerAnimator.play(0);
                zemljaAnimator.play(0);
            }*/
            
        



        
    }
});

npcZemlja.addComponent({
    update(t, dt) {
        // if (!zemljaAnimator.playing){
        //     zemljaAnimator.play(0);
        // }
        // return;

        if(!gameRunning) {
            return;
        }
        /*
        hitStop.update(dt);
        if(hitStop.active) {
            return;
        }*/

        if(!zemljaAnimator.playing && soundAlreadyPlayed) {
            soundAlreadyPlayed = false;
        }

        decisionTimer -= dt;

        const s = playerTransform.translation;
        const z = npcZemljaTransform.translation;
        const razlika = Math.abs(s[0] - z[0]);


        if(decisionTimer <= 0 && !zemljaAnimator.playing) {
            // popravi dejanja
            //console.log("zgodi se neka anmiacija");
            zemljaBlocking = false;

            decisionTimer = 0.1 + Math.random() * 0.1;
            const r = Math.random();
            //console.log("random: " + r);

            // v rangeu za vse ounche razmerje je 30% blokada, 30% napad(15 punch, 15 super punch), 30% odmik, 10% jump 
            if(razlika <= hitRange) {
                if(r <= 0.1) {
                    zemljaAction = "jump";
                } else if(r <= 0.2) {
                    zemljaAction = "block";
                } else if(r <= 0.8) {
                    zemljaAction = "punch";                   
                } else if(r <= 0.88 ) {
                    zemljaAction = "superPunch";
                } else {
                    zemljaAction = "retreat";
                }
            } else if(razlika <= kickRange) { // 30% block, 15% advance, 15% retreat, 30% attack, 10% jump
                if(r <= 0.3) {
                    zemljaAction = "block";
                } else if(r <= 0.45) {
                    zemljaAction = "advance";
                } else if(r <= 0.6) {
                    zemljaAction = "retreat";
                } else if(r <= 0.9) {
                    zemljaAction = "kick";
                } else {
                    zemljaAction = "jump";
                }
            } else{ // 30% idle, 40% advance, 10% jump, 10% block, 
                if(r <= 0.1) {
                    zemljaAction = "jump";
                } else if(r <= 0.2) {
                    zemljaAction = "block";
                } else if (r <= 0.3) {
                    zemljaAction = "kick";
                } else if(r <= 0.9) {
                    zemljaAction = "punch";
                } else {
                    zemljaAction = "advance";
                }
            }


            switch(zemljaAction) {
            case "idle":
               zemljaAnimator.play(0);
                break;
            case "advance":
                zemljaAnimator.play(2);
                break;
            case "retreat":
                zemljaAnimator.play(3);
                break;
            case "jump":
                zemljaAnimator.play(4);
                zemljaJumping = true;
                zemljaVelocity = zemljaInitVelY;
                break;
            case "block":
                zemljaAnimator.play(5);
                zemljaBlocking = true;
                break;
            case "punch":
                zemljaAnimator.play(6);
                zemljaAttacking = true;
                alreadyHitSonce = false;
                if(Math.abs(razlika) <= hitRange) {    
                    setTimeout(()=> {
                        hitStop.trigger(0.1);
                    },300);
                }
                break;
            case "superPunch":
                zemljaAnimator.play(7);
                zemljaAttacking = true;
                alreadyHitSonce = false;
                if(Math.abs(razlika) <= hitRange) {    
                    setTimeout(()=> {
                        hitStop.trigger(0.1);
                    },800);
                }
                break;
            case "kick":
                zemljaAnimator.play(8);
                zemljaAttacking = true;
                alreadyHitSonce = false;
                if(Math.abs(razlika) <= kickRange) {    
                    setTimeout(()=> {
                        hitStop.trigger(0.1);
                    },900);
                }
                break;
            
        }
              

        }


        if(zemljaAnimator.playingAnim == 2 && zemljaAction == "advance") {

            if (zemljaAnimator.time > 0.2 && zemljaAnimator.time < zemljaAnimator.animLen - 0.2) {
                npcZemljaTransform.translation[0] -= zemljaPremik * dt * rotationalCoefcient;
            }
        }

        if(zemljaAnimator.playingAnim == 3 && zemljaAction == "retreat") {
            
            if (zemljaAnimator.time > 0.2 && zemljaAnimator.time < zemljaAnimator.animLen - 0.2) {
                npcZemljaTransform.translation[0] += zemljaPremik * dt * rotationalCoefcient;
            }
            //zemljaMoveOnce = false;
        }

        // zemlja premik pri napadu
        if(zemljaAnimator.playingAnim == 6 && zemljaAction == "punch") {

            if(zemljaAnimator.time > 0.2 && zemljaAnimator.time < zemljaAnimator.animLen - 0.2) {
                npcZemljaTransform.translation[0] -= zemljaPremik * dt * rotationalCoefcient;
            }
        }

        if (zemljaAnimator.playingAnim == 4 && zemljaJumping && zemljaAnimator.time > 0.3 && zemljaAnimator.time < zemljaAnimator.animLen - 0.3 ){
    
            zemljaVelocity -= zemljaGravity*dt;
            npcZemljaTransform.translation[1] += zemljaVelocity*dt;

            if(npcZemljaTransform.translation[1] <= -1) {
                npcZemljaTransform.translation[1] = -1;
                zemljaJumping = false;
            }

        }

        if (zemljaAnimator.playingAnim == 6 && zemljaAttacking && Math.abs(razlika) <= hitRange && grounded && !soundAlreadyPlayed) {
            //freezetimer = 1;
            punchSound.currentTime = 0;
            blockSound.currentTime = 0;
            

            if (!alreadyHitSonce && zemljaAnimator.time > 0.3 && zemljaAnimator.time < 0.5 && !blocking) {
                healthPlayer -= punchDamage;
                alreadyHitSonce = true; // mark that hit connected
                sonceHit = true;
                //freezetimer = 5;
                playerAnimator.play(8); // force hit reaction
                punchSound.play();
                soundAlreadyPlayed = true;
                //npcZemljaTransform.translation[0] -= zemljaPremik * dt * rotationalCoefcient;
                //freezetimer = 3;
                updateHealthBars("player-health-bar", healthPlayer, maxHealth);
                console.log("player hit: " + healthPlayer);
                //freezetimer = 5;
                checkGameOver();
            } else if(zemljaAnimator.time > 0.3 && zemljaAnimator.time < 0.5 && blocking){
                blockSound.play();
                soundAlreadyPlayed = true;
            }
            //soundAlreadyPlayed = true;
        } else if(zemljaAnimator.playingAnim == 6 && Math.abs(razlika) > hitRange && zemljaAnimator.time > 0.3 && zemljaAnimator.time < 0.5 && !soundAlreadyPlayed) {
            punchMissSound.currentTime = 0;
            punchMissSound.play();
            soundAlreadyPlayed = true;
        }

        if (zemljaAnimator.playingAnim == 7 && zemljaAttacking && Math.abs(razlika) <= hitRange && grounded && !soundAlreadyPlayed) {
            //freezetimer = 1;
            superPunchSound.currentTime = 0;
            blockSound.currentTime = 0;

            
            if (!alreadyHitSonce && zemljaAnimator.time > 1 && zemljaAnimator.time < zemljaAnimator.animLen - 0.5 && !blocking) {
                healthPlayer -= hookDamage;
                alreadyHitSonce = true; // mark that hit connected
                sonceHit = true;
                //freezetimer = 5;

                playerAnimator.play(8); // force hit reaction
                superPunchSound.play();
                soundAlreadyPlayed = true;
                playerGetSuperPunched = true;
                //freezetimer = 3;
                updateHealthBars("player-health-bar", healthPlayer, maxHealth);
                console.log("player hit: " + healthPlayer);
                //freezetimer = 5;
                checkGameOver();
            } else if(zemljaAnimator.time > 1 && zemljaAnimator.time < zemljaAnimator.nimLen - 0.5 && blocking) {
                blockSound.play();
                soundAlreadyPlayed = true;
            }

            //soundAlreadyPlayed = true;

        } else if(zemljaAnimator.playingAnim == 7 && Math.abs(razlika) > hitRange && zemljaAnimator.time > 1 && zemljaAnimator.time < zemljaAnimator.animLen - 0.5 && !soundAlreadyPlayed) {
            superMissSound.currentTime = 0;
            superMissSound.play();
            soundAlreadyPlayed = true;
        }

        if (zemljaAnimator.playingAnim == 8 && zemljaAttacking && Math.abs(razlika) <= kickRange && grounded && !soundAlreadyPlayed) {
            //freezetimer = 1;
            kickSound.currentTime = 0;
            blockSound.curretTime = 0;


            if (!alreadyHitSonce && zemljaAnimator.time > 0.3 && zemljaAnimator.time < 0.5 && !blocking) {
                healthPlayer -= kickDamage;
                alreadyHitSonce = true; // mark that hit connected
                sonceHit = true;
                //freezetimer = 5;
                playerAnimator.play(9); // force hit reaction - animation with step-back (knockback)
                kickSound.play();
                soundAlreadyPlayed = true;
                //freezetimer = 3;
                playerGetKicked = true;
                //if (playerAnimator.time > 0.2 && playerAnimator.time < playerAnimator.animLen - 0.2) {
                //playerTransform.translation[0] -= velocityLR * dt;
                updateHealthBars("player-health-bar", healthPlayer, maxHealth);
                console.log("player hit: " + healthPlayer);
                //freezetimer = 5;
                checkGameOver();
            } else if(zemljaAnimator.time > 0.3 && zemljaAnimator.time < 0.5 && blocking) {
                blockSound.play();
                soundAlreadyPlayed = true;
            }

            //soundAlreadyPlayed = true;

        } else if(zemljaAnimator.playingAnim == 8 && Math.abs(razlika) > kickRange && zemljaAnimator.time > 0.3 && zemljaAnimator.time < 0.5 && !soundAlreadyPlayed) {
            kickMissSound.currentTime = 0;
            kickMissSound.play();
            soundAlreadyPlayed = true;
        }

        //zemlja hit stepback movement
        if(zemljaAnimator.playingAnim == 9 && zemljaAnimator.time > 0.2 && zemljaAnimator.time < zemljaAnimator.animLen - 0.8) {
            npcZemljaTransform.translation[0] += zemljaPremik * dt * rotationalCoefcient;
        }


        if(!zemljaAnimator.playing && zemljaAttacking) {
            zemljaAttacking = false;
            alreadyHitSonce = false;
            //soundAlreadyPlayed = false;
        }

        
        
        //[zemljaIdleAnim: 0, zemljaHitAnim: 1, zemljaStepForward: 2, zemljaStepBack: 3, zemljaJump: 4, zemljaBlock: 5, zemljaPunchAnim,: 6 zemljaHookPunch: 7, zemljaKick: 8]

        //izvajaj trenutno animacijo
        //if(zemljaAction == "idle") {
          //  console.log("dogaja se animacija");
            //zemljaAnimator.play(0);
        //}

        

        /*
        switch(zemljaAction) {
            case "idle":
                zemljaAnimator.play(0);
                break;
            case "advance":
                zemljaAnimator.play(2);
                npcZemljaTransform.translation[0] += velocityLR * dt;
                break;
            case "retreat":
                zemljaAnimator.play(3);
                npcZemljaTransform.translation[0] -= velocityLR * dt;
                break;
            case "jump":
                zemljaVelocity = initVelY;
                zemljaAnimator.play(4);
                zemljaJumping = true;
                break;
            case "block":
                zemljaAnimator.play(5);
                zemljaBlocking = true;
                break;
            case "punch":
                zemljaAnimator.play(6);
                zemljaAttacking = true;
                break;
            case "superPunch":
                zemljaAnimator.play(7);
                zemljaAttacking = true;
                break;
            case "kick":
                zemljaAnimator.play(8);
                zemljaAttacking = true;
                break;
            
        }*/
        
        /*
        if (!zemljaAnimator.playing){
            moveOnceZemlja = true;
            grounded = true;    
            attacking = false;
            alreadyHit = false;
            blocking = false;

           
            if (!keys.a && !keys.d && !keys.w){ //zato da objekt ne gre za 1 frame v idle mode potem pa ze v nek movind animation ce drzimo nek gumb
                //playerAnimator.play(0);
                zemljaAnimator.play(0);
            }
            
        }*/
        
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

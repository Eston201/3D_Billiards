/**
 * Ten Minute Physics: https://www.youtube.com/watch?v=ThhdlMbGT5g&t=271s
 * This is a replication of the above video but in 3D 
 * khanacademy: https://www.khanacademy.org/computing/pixar/effects/particle-physics/v/fx-collision
 * Above helped with the understanding of the vector math :)
*/

import * as THREE from 'three'
import Ball from './Ball';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Pane } from 'tweakpane';
import Stats from 'stats.js';

const canvas = document.getElementById('webGLCanvas');
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

// Init Variables
const gravity = new THREE.Vector3(0, -9.8, 0);
const dt = 1.0 / 60.0; // Use a small timestep to simulate physics
let restitution = 1;
let numBillards = 30;

/**
 * Debug
*/
const pane = new Pane();
const debugOptions = {
    gravityX: gravity.x,
    gravityY: gravity.y,
    gravityZ: gravity.z,
    restitution,
    numBillards,
}

const gravityFolder = pane.addFolder({
    title: 'Gravity',
    expand: true
});
gravityFolder.addBinding(debugOptions, 'gravityX', {
    min: -10,
    max: 10,
}).on('change', ({value}) => gravity.x = value);

gravityFolder.addBinding(debugOptions, 'gravityY', {
    min: -10,
    max: 10,
}).on('change', ({value}) => gravity.y = value);

gravityFolder.addBinding(debugOptions, 'gravityZ', {
    min: -10,
    max: 10,
}).on('change', ({value}) => gravity.z = value);

pane.addBinding(debugOptions, 'restitution', {
    min: 0,
    max: 1,
    step: 0.1
}).on('change', ({value}) => restitution = value);


/**
 * Main
*/
function main(canvas) {
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true
    });
    const camera = new THREE.PerspectiveCamera(
        45,
        1,
        0.1,
        100
    );
    camera.position.set(0, 1, 10);
    camera.lookAt(0, 0, 0);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    
    const scene = new THREE.Scene();
    
    
    /**
     * Billiard Container 
    */
    const containerDimensions = [
        8,
        4,
        4
    ];
    const billiardContainerGeo = new THREE.BoxGeometry(...containerDimensions);
    const billiardBox = new THREE.Mesh(billiardContainerGeo);
    const billiardContainer = new THREE.BoxHelper(billiardBox, 0x474747);
    billiardContainer.material.blending = THREE.AdditiveBlending;
    billiardContainer.material.transparent = true;
    scene.add(billiardContainer);
    // To check if balls position is out of the container
    const boxBoundry = new THREE.Vector3(...containerDimensions.map((dim) => (dim / 2) - 0.2)); 

    /**
     * Billiards
    */
    const billiards = [];
    const radius = 0.2;
    // Just one Geometry and Material for all balls
    const ballGeo = new THREE.SphereGeometry(radius, 15, 15);
    const ballMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
    });

    pane.addBinding(debugOptions, 'numBillards', {
        min: 2,
        max: 100,
        step: 1
    }).on('change', ({value}) => {
        numBillards = value;
        destroyCurrentBilliards();
        createBilliards();
    });

    function createBilliards() {
        let i = 0;
        for (i; i < numBillards; i++) {
            const mass = Math.random() * 0.2;
            // const mass = 0.2;
            const ballPosition = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 2,
            );
            const velocity = new THREE.Vector3(
                Math.random(), 
                Math.random(), 
                0
            );
            const billiard = new Ball(
                ballGeo, 
                ballMat, 
                radius, 
                mass, 
                ballPosition, 
                velocity
            );
            billiards.push(billiard);
            scene.add(billiard.getMesh);
        }
    }

    function destroyCurrentBilliards() {
        billiards.forEach((billiard) => billiard.dispose(scene));
        billiards.splice(0, numBillards);
    }

    function simulatePhysics() {
        let i = 0;
        for (i; i < billiards.length; i++) {
            const billiard1 = billiards[i];
            billiard1.simulate(gravity, dt);

            let j = i + 1;
            for (j; j < billiards.length; j++) {
                const billiard2 = billiards[j];
                handleBallCollision(billiard1, billiard2, restitution);
            }
            billiard1.handleWallCollision(boxBoundry);
        }
    }

    // TODO: Replicate the spacial hash check instead
    function handleBallCollision(ball1, ball2, restitution) {
        /**
         * e -> restitution
         * speed of seperation / speed of approach
         * e = (v2 - v1) / (u2 - u1)
         *
         *  Linear Momentum: u -> initial velocity
         * m1 * u1  + m2 * u2 = m1 * v1 + m2 * v2
         * v1 = (m1u1 + m2u2 - m2(u1-u2)e)/ m1 + m2
         * v2 = (m1u1 + m2u2 - m1(u2-u1)e)/ m1 + m2
        */

        // Get the direction of the collision line
        const dir = new THREE.Vector3();
        dir.subVectors(ball1.ballPosition, ball2.ballPosition);

        // Check if balls are colliding
        const distance = dir.lengthSq();
        if (distance > (ball1.radius + ball2.radius) * (ball1.radius + ball2.radius)) return

        // Collision
        // Get the normalized direction
        dir.normalize();
        // seperate the balls by some scalar on the collision line 
        const corr = ((ball1.radius + ball2.radius) + (distance)) / 4.0;
		ball1.vel.addScaledVector(dir, -corr);
		ball2.vel.addScaledVector(dir, corr);

        // Use linear momentum and restitution to get final Vs
        const e = restitution
        const u1 = new THREE.Vector3().copy(ball1.vel).dot(dir);
        const u2 = new THREE.Vector3().copy(ball2.vel).dot(dir);
        const m1 = ball1.mass;
        const m2 = ball2.mass;
        const m1u1 = m1 * u1; 
        const m2u2 = m2 * u2;
        const v1 = m1u1 + m2u2 - m2 * (u1 - u2) * e / (m1 + m2);
        const v2 = m1u1 + m2u2 - m1 * (u2 - u1) * e / (m1 + m2);

        // Add the scalar Vs in the direction of the collision line
        ball1.vel.addScaledVector(dir, v1 - u1);
        ball2.vel.addScaledVector(dir, v2 - u2);
    }
    
    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width  = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            const pixelRatio = window.devicePixelRatio;
            renderer.setPixelRatio(Math.min(pixelRatio, 2));
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function render() {
        stats.begin();
        simulatePhysics();
        
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        controls.update();
        renderer.render(scene, camera);

        stats.end();
        requestAnimationFrame(render);
    }

    createBilliards();
    render();
}

main(canvas);
import * as THREE from 'three'

class Ball {

    constructor(ballGeo, ballMat, radius, mass, position, velocity, scene) {
        // Physics Data
        this.simulatedPosition = position;
        this.radius = radius;
        this.mass = mass;
        this.vel = velocity;

        // The Mesh
        this.ball = new THREE.Mesh(ballGeo, ballMat);
        this.setBallPosition = position
    }

    /**
     * Simulate physics of the ball
     * @param {THREE.Vector3} gravity 
     * @param {THREE.Vector3} dt 
    */
    simulate(gravity, dt) {
        this.vel.addScaledVector(gravity, dt);
        this.simulatedPosition.addScaledVector(this.vel, dt);
        this.setBallPosition = this.simulatedPosition;
    }

    /** 
     * Handles wall collisions by just negating the component of the velocity 
     * vector and setting the position
     * @param {THREE.Vector3} bounds 
    */
    handleWallCollision(bounds) {
        if (this.ballPosition.x < -bounds.x) {
            this.ballPosition.x = -bounds.x;
            this.vel.x = -this.vel.x;
        }
        if (this.ballPosition.x > bounds.x) {
            this.ballPosition.x = bounds.x;
            this.vel.x = -this.vel.x;
        }
        if (this.ballPosition.z < -bounds.z) {
            this.ballPosition.z = -bounds.z;
            this.vel.z = -this.vel.z;
        }
        if (this.ballPosition.z > bounds.z) {
            this.ballPosition.z = bounds.z;
            this.vel.z = -this.vel.z;
        }
        if (this.ballPosition.y < -bounds.y) {
            this.ballPosition.y = -bounds.y;
            this.vel.y = -this.vel.y
        }
        if (this.ballPosition.y > bounds.y) {
            this.ballPosition.y = bounds.y;
            this.vel.y = -this.vel.y
        }
    }

    get ballPosition() {
        return this.simulatedPosition;
    }
    get getMesh() {
        return this.ball;
    }

    /**
     * @param {THREE.Vector3} pos
    */
    set setBallPosition(pos) {
        this.ball.position.copy(pos);
    }

    /**
     * 
     * @param {THREE.Scene} scene 
     */
    dispose(scene) {
        scene.remove(this.ball);
        this.ball.geometry.dispose();
        this.ball.material.dispose();
    }
}

export default Ball
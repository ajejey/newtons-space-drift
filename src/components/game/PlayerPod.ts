import * as Phaser from 'phaser';

interface Controls {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

interface GameScene extends Phaser.Scene {
  getFuel(): number;
  consumeFuel(amount: number): void;
}

export class PlayerPod extends Phaser.GameObjects.Sprite {
  private velocity = { x: 0, y: 0 };
  private thrusterForce = 0.3;
  private maxVelocity = 200;
  private thrusterFlames: Phaser.GameObjects.Sprite[] = [];
  private currentThrust = { x: 0, y: 0 };
  private mass = 1;
  private isThrusting_flag = false;
  private gravityTrail: Phaser.GameObjects.Graphics;
  private trailPoints: {x: number, y: number}[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-ship');
    
    scene.add.existing(this);
    this.setOrigin(0.5);
    this.setDepth(10);
    this.setScale(0.8); // Scale the ship to an appropriate size
    
    // Create thruster flame sprites
    this.createThrusterFlames();
    
    // Create gravity trail for visual feedback
    this.createGravityTrail();
  }

  private createThrusterFlames() {
    // Create 4 thruster flames for each direction with appropriate textures
    const flameConfig = [
      { x: 0, y: 20, texture: 'thruster-up' },     // Bottom (main engine) - flame points up
      { x: 0, y: -20, texture: 'thruster-down' },   // Top - flame points down
      { x: -20, y: 0, texture: 'thruster-right' },  // Left - flame points right
      { x: 20, y: 0, texture: 'thruster-left' }     // Right - flame points left
    ];
    
    flameConfig.forEach((config) => {
      const flame = this.scene.add.sprite(this.x + config.x, this.y + config.y, config.texture);
      flame.setVisible(false);
      flame.setDepth(5);
      flame.setScale(0.8); // Scale to appropriate size
      this.thrusterFlames.push(flame);
    });
  }

  private createGravityTrail() {
    // Create graphics object for showing movement trail when affected by gravity
    this.gravityTrail = this.scene.add.graphics();
    this.gravityTrail.setDepth(5);
  }

  update(delta: number, controls: Controls) {
    this.isThrusting_flag = false;
    this.currentThrust = { x: 0, y: 0 };
    
    // Store previous velocity to detect gravity effects
    const prevVelocity = { x: this.velocity.x, y: this.velocity.y };
    
    // Check if we have fuel before allowing thrust
    const hasFuel = this.scene.scene.key === 'GameScene' ? 
      (this.scene as GameScene).getFuel() > 0 : true;
    
    // Apply thrust based on input (Newton's 3rd Law - action/reaction)
    // Only if we have fuel available
    if (hasFuel) {
      if (controls.up) {
        this.currentThrust.y = -this.thrusterForce;
        this.isThrusting_flag = true;
        this.showThrusterFlame(0); // Bottom thruster
      }
      if (controls.down) {
        this.currentThrust.y = this.thrusterForce;
        this.isThrusting_flag = true;
        this.showThrusterFlame(1); // Top thruster
      }
      if (controls.left) {
        this.currentThrust.x = -this.thrusterForce;
        this.isThrusting_flag = true;
        this.showThrusterFlame(3); // Right thruster
      }
      if (controls.right) {
        this.currentThrust.x = this.thrusterForce;
        this.isThrusting_flag = true;
        this.showThrusterFlame(2); // Left thruster
      }
    }
    
    // Newton's 2nd Law: F = ma, so a = F/m
    const acceleration = {
      x: this.currentThrust.x / this.mass,
      y: this.currentThrust.y / this.mass
    };
    
    // Apply acceleration to velocity (thrust only - gravity is handled by PhysicsEngine)
    this.velocity.x += acceleration.x * delta * 0.1;
    this.velocity.y += acceleration.y * delta * 0.1;
    
    // Limit velocity
    const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (speed > this.maxVelocity) {
      this.velocity.x = (this.velocity.x / speed) * this.maxVelocity;
      this.velocity.y = (this.velocity.y / speed) * this.maxVelocity;
    }
    
    // Newton's 1st Law: Object in motion stays in motion (no friction in space)
    this.x += this.velocity.x * delta * 0.01;
    this.y += this.velocity.y * delta * 0.01;
    
    // Update gravity trail if velocity changed due to external forces
    this.updateGravityTrail(prevVelocity);
    
    // Update gravity trail if velocity changed due to external forces
    this.updateGravityTrail(prevVelocity);
    
    // Keep player on screen (wrap around)
    this.wrapAroundScreen();
    
    // Update thruster flame positions
    this.updateThrusterFlames();
    
    // Hide all thruster flames if not thrusting
    if (!this.isThrusting_flag) {
      this.thrusterFlames.forEach(flame => flame.setVisible(false));
    }
    
    // Consume fuel when thrusting
    if (this.isThrusting_flag && this.scene.scene.key === 'GameScene') {
      (this.scene as GameScene).consumeFuel(0.5 * delta * 0.01);
    }
  }

  private updateGravityTrail(prevVelocity: {x: number, y: number}) {
    // Check if velocity changed due to external forces (gravity)
    const thrustAccel = Math.sqrt(this.currentThrust.x * this.currentThrust.x + this.currentThrust.y * this.currentThrust.y);
    const velocityChange = Math.sqrt(
      Math.pow(this.velocity.x - prevVelocity.x, 2) + 
      Math.pow(this.velocity.y - prevVelocity.y, 2)
    );
    
    // If velocity changed more than expected from thrust alone, we're likely affected by gravity
    if (velocityChange > thrustAccel * 0.1 + 0.01) {
      // Add current position to trail
      this.trailPoints.push({ x: this.x, y: this.y });
      
      // Keep only last 15 points
      if (this.trailPoints.length > 15) {
        this.trailPoints.shift();
      }
      
      // Draw the trail
      this.gravityTrail.clear();
      if (this.trailPoints.length > 1) {
        this.gravityTrail.lineStyle(2, 0x00E5FF, 0.6);
        this.gravityTrail.beginPath();
        this.gravityTrail.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
        
        for (let i = 1; i < this.trailPoints.length; i++) {
          const alpha = i / this.trailPoints.length; // Fade older points
          this.gravityTrail.lineStyle(2, 0x00E5FF, alpha * 0.6);
          this.gravityTrail.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
        }
        
        this.gravityTrail.strokePath();
      }
    } else {
      // Clear trail if not affected by gravity
      this.trailPoints = [];
      this.gravityTrail.clear();
    }
  }

  private showThrusterFlame(index: number) {
    if (this.thrusterFlames[index]) {
      this.thrusterFlames[index].setVisible(true);
      
      // Create a more dynamic thruster effect
      const flame = this.thrusterFlames[index];
      
      // Randomly vary alpha for pulsing effect
      flame.setAlpha(Phaser.Math.FloatBetween(0.8, 1.0));
      
      // Randomly vary scale for flickering effect
      const baseScale = 0.8;
      const scaleVariation = Phaser.Math.FloatBetween(-0.1, 0.1);
      flame.setScale(baseScale + scaleVariation);
    }
  }

  private updateThrusterFlames() {
    const flameOffsets = [
      { x: 0, y: 20 },   // Bottom (main engine)
      { x: 0, y: -20 },  // Top
      { x: -20, y: 0 },  // Left
      { x: 20, y: 0 }    // Right
    ];
    
    this.thrusterFlames.forEach((flame, index) => {
      flame.x = this.x + flameOffsets[index].x;
      flame.y = this.y + flameOffsets[index].y;
    });
  }

  private wrapAroundScreen() {
    const gameWidth = this.scene.sys.game.config.width as number;
    const gameHeight = this.scene.sys.game.config.height as number;
    
    if (this.x < 0) this.x = gameWidth;
    if (this.x > gameWidth) this.x = 0;
    if (this.y < 0) this.y = gameHeight;
    if (this.y > gameHeight) this.y = 0;
  }

  public getVelocity() {
    return { x: this.velocity.x, y: this.velocity.y };
  }

  public getPosition() {
    return { x: this.x, y: this.y };
  }

  public isThrusting() {
    return this.isThrusting_flag;
  }

  public getThrustVector() {
    return this.currentThrust;
  }

  public increaseMass(amount: number) {
    this.mass += amount;
  }

  public decreaseMass(amount: number) {
    this.mass = Math.max(0.5, this.mass - amount);
  }

  public resetMass() {
    this.mass = 1.0; // Reset to base mass
  }

  public getMass(): number {
    return this.mass;
  }

  public setVelocity(vx: number, vy: number) {
    this.velocity.x = vx;
    this.velocity.y = vy;
  }

  destroy() {
    this.thrusterFlames.forEach(flame => flame.destroy());
    if (this.gravityTrail) {
      this.gravityTrail.destroy();
    }
    super.destroy();
  }
}

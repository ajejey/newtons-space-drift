import * as Phaser from 'phaser';

export class Debris extends Phaser.GameObjects.Sprite {
  private velocity: { x: number; y: number };
  private mass: number;
  private rotationSpeed: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'debris');
    
    scene.add.existing(this);
    this.setOrigin(0.5);
    this.setDepth(3);
    
    // Random velocity for drifting motion
    this.velocity = {
      x: Phaser.Math.FloatBetween(-30, 30),
      y: Phaser.Math.FloatBetween(-30, 30)
    };
    
    this.mass = Phaser.Math.FloatBetween(0.5, 2.0);
    this.rotationSpeed = Phaser.Math.FloatBetween(-0.02, 0.02);
    
    // Scale based on mass
    const scale = 0.5 + (this.mass * 0.3);
    this.setScale(scale);
  }

  update(delta: number) {
    // Apply velocity (drifting motion)
    this.x += this.velocity.x * (delta / 1000);
    this.y += this.velocity.y * (delta / 1000);
    
    // Rotate for visual effect
    this.rotation += this.rotationSpeed;
    
    // Wrap around screen
    this.wrapAroundScreen();
  }

  private wrapAroundScreen() {
    const gameWidth = this.scene.sys.game.config.width as number;
    const gameHeight = this.scene.sys.game.config.height as number;
    
    if (this.x < -50) this.x = gameWidth + 50;
    if (this.x > gameWidth + 50) this.x = -50;
    if (this.y < -50) this.y = gameHeight + 50;
    if (this.y > gameHeight + 50) this.y = -50;
  }

  public getVelocity(): { x: number; y: number } {
    return { ...this.velocity };
  }

  public setVelocity(vx: number, vy: number) {
    this.velocity.x = vx;
    this.velocity.y = vy;
  }

  public getMass(): number {
    return this.mass;
  }

  public handleCollision(otherVelocity: { x: number; y: number }, otherMass: number): { x: number; y: number } {
    // Simple elastic collision calculation
    const totalMass = this.mass + otherMass;
    
    // Calculate new velocities using conservation of momentum
    const newVelX = ((this.mass - otherMass) * this.velocity.x + 2 * otherMass * otherVelocity.x) / totalMass;
    const newVelY = ((this.mass - otherMass) * this.velocity.y + 2 * otherMass * otherVelocity.y) / totalMass;
    
    // Return the velocity change for the other object
    const otherNewVelX = ((otherMass - this.mass) * otherVelocity.x + 2 * this.mass * this.velocity.x) / totalMass;
    const otherNewVelY = ((otherMass - this.mass) * otherVelocity.y + 2 * this.mass * this.velocity.y) / totalMass;
    
    // Update this debris velocity
    this.velocity.x = newVelX;
    this.velocity.y = newVelY;
    
    return { x: otherNewVelX, y: otherNewVelY };
  }
}
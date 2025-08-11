import * as Phaser from 'phaser';

export class PhysicsEngine {
  private scene: Phaser.Scene;
  private bodies: any[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public addBody(gameObject: Phaser.GameObjects.GameObject, options?: any) {
    // Simple physics body for basic collision detection
    const body = {
      gameObject,
      x: (gameObject as any).x || 0,
      y: (gameObject as any).y || 0,
      width: (gameObject as any).width || 32,
      height: (gameObject as any).height || 32,
      velocity: { x: 0, y: 0 },
      mass: options?.mass || 1,
      ...options
    };
    
    this.bodies.push(body);
    return body;
  }

  public removeBody(gameObject: Phaser.GameObjects.GameObject) {
    const index = this.bodies.findIndex(body => body.gameObject === gameObject);
    if (index !== -1) {
      this.bodies.splice(index, 1);
    }
  }

  public update(delta: number) {
    // Update physics bodies
    this.bodies.forEach(body => {
      if (body.gameObject && body.gameObject.active) {
        // Sync position with game object
        body.x = (body.gameObject as any).x;
        body.y = (body.gameObject as any).y;
      }
    });

    // Check collisions
    this.checkCollisions();
  }

  private checkCollisions() {
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const bodyA = this.bodies[i];
        const bodyB = this.bodies[j];
        
        if (this.isColliding(bodyA, bodyB)) {
          this.resolveCollision(bodyA, bodyB);
        }
      }
    }
  }

  private isColliding(bodyA: any, bodyB: any): boolean {
    const dx = bodyA.x - bodyB.x;
    const dy = bodyA.y - bodyB.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = (bodyA.width + bodyB.width) / 4; // Simple circular collision
    
    return distance < minDistance;
  }

  private resolveCollision(bodyA: any, bodyB: any) {
    // Simple elastic collision with momentum conservation
    const dx = bodyA.x - bodyB.x;
    const dy = bodyA.y - bodyB.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    // Normalize collision vector
    const nx = dx / distance;
    const ny = dy / distance;
    
    // Relative velocity
    const dvx = bodyA.velocity.x - bodyB.velocity.x;
    const dvy = bodyA.velocity.y - bodyB.velocity.y;
    
    // Relative velocity along collision normal
    const dvn = dvx * nx + dvy * ny;
    
    // Do not resolve if velocities are separating
    if (dvn > 0) return;
    
    // Collision impulse
    const impulse = 2 * dvn / (bodyA.mass + bodyB.mass);
    
    // Update velocities
    bodyA.velocity.x -= impulse * bodyB.mass * nx;
    bodyA.velocity.y -= impulse * bodyB.mass * ny;
    bodyB.velocity.x += impulse * bodyA.mass * nx;
    bodyB.velocity.y += impulse * bodyA.mass * ny;
    
    // Separate objects
    const overlap = (bodyA.width + bodyB.width) / 4 - distance;
    const separationX = nx * overlap * 0.5;
    const separationY = ny * overlap * 0.5;
    
    (bodyA.gameObject as any).x += separationX;
    (bodyA.gameObject as any).y += separationY;
    (bodyB.gameObject as any).x -= separationX;
    (bodyB.gameObject as any).y -= separationY;
  }

  public applyForce(body: any, forceX: number, forceY: number) {
    // F = ma, so a = F/m
    const accelerationX = forceX / body.mass;
    const accelerationY = forceY / body.mass;
    
    body.velocity.x += accelerationX;
    body.velocity.y += accelerationY;
  }

  public getBodies() {
    return this.bodies;
  }
}
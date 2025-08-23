import * as Phaser from 'phaser';

export class GravityWell extends Phaser.GameObjects.Container {
  private gravitationalConstant: number;
  private mass: number;
  private radius: number;
  private visualRadius: number;
  private planetSprite: Phaser.GameObjects.Arc;
  private atmosphereSprite: Phaser.GameObjects.Arc;
  private gravityField: Phaser.GameObjects.Graphics;
  private pulseEffect: Phaser.GameObjects.Arc;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    mass: number = 100,
    radius: number = 40,
    visualRadius: number = 200
  ) {
    super(scene, x, y);
    
    this.gravitationalConstant = 500; // Adjusted for game scale
    this.mass = mass;
    this.radius = radius;
    this.visualRadius = visualRadius;
    
    scene.add.existing(this);
    this.setDepth(1);
    
    this.createVisuals();
    this.createGravityFieldVisualization();
  }

  private createVisuals() {
    // Create gravity field visualization (outer ring)
    this.gravityField = this.scene.add.graphics();
    this.gravityField.lineStyle(2, 0x4A90E2, 0.3);
    this.gravityField.strokeCircle(0, 0, this.visualRadius);
    this.gravityField.lineStyle(1, 0x4A90E2, 0.2);
    this.gravityField.strokeCircle(0, 0, this.visualRadius * 0.7);
    this.gravityField.strokeCircle(0, 0, this.visualRadius * 0.4);
    this.add(this.gravityField);

    // Create atmosphere effect
    this.atmosphereSprite = this.scene.add.circle(0, 0, this.radius * 1.5, 0x4A90E2, 0.1);
    this.add(this.atmosphereSprite);

    // Create main planet/station body
    this.planetSprite = this.scene.add.circle(0, 0, this.radius, 0x2E4A68, 1);
    this.planetSprite.setStrokeStyle(2, 0x4A90E2);
    this.add(this.planetSprite);

    // Create pulsing effect to show active gravity
    this.pulseEffect = this.scene.add.circle(0, 0, this.radius * 0.8, 0x4A90E2, 0.3);
    this.add(this.pulseEffect);

    // Add label
    const label = this.scene.add.text(0, this.radius + 20, 'GRAVITY WELL', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#4A90E2',
      align: 'center'
    }).setOrigin(0.5);
    this.add(label);

    // Create pulsing animation
    this.scene.tweens.add({
      targets: this.pulseEffect,
      alpha: 0.1,
      scale: 1.2,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Animate gravity field
    this.scene.tweens.add({
      targets: this.gravityField,
      alpha: 0.8,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createGravityFieldVisualization() {
    // Add some visual particles to show the gravity field
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const distance = this.visualRadius * 0.9;
      const particleX = Math.cos(angle) * distance;
      const particleY = Math.sin(angle) * distance;
      
      const particle = this.scene.add.circle(particleX, particleY, 2, 0x4A90E2, 0.6);
      this.add(particle);

      // Animate particles in orbital motion
      this.scene.tweens.add({
        targets: particle,
        rotation: Math.PI * 2,
        duration: 8000 + (i * 500), // Stagger the orbital periods
        repeat: -1,
        ease: 'Linear'
      });
    }
  }

  /**
   * Calculate gravitational force on an object at given position
   * Returns force vector {x, y}
   */
  public calculateGravitationalForce(objectX: number, objectY: number, objectMass: number = 1): {x: number, y: number} {
    const dx = this.x - objectX;
    const dy = this.y - objectY;
    const distanceSquared = dx * dx + dy * dy;
    const distance = Math.sqrt(distanceSquared);

    // Prevent division by zero and infinite forces at center
    if (distance < this.radius) {
      return { x: 0, y: 0 };
    }

    // F = G * (m1 * m2) / r^2
    const forceMagnitude = this.gravitationalConstant * this.mass * objectMass / distanceSquared;
    
    // Normalize direction vector
    const forceX = (dx / distance) * forceMagnitude;
    const forceY = (dy / distance) * forceMagnitude;

    return { x: forceX, y: forceY };
  }

  /**
   * Check if an object is within the gravity well's influence
   */
  public isInGravityField(objectX: number, objectY: number): boolean {
    const distance = Phaser.Math.Distance.Between(this.x, this.y, objectX, objectY);
    return distance <= this.visualRadius;
  }

  /**
   * Get the strength of gravity at a specific point (0-1, where 1 is strongest)
   */
  public getGravityStrength(objectX: number, objectY: number): number {
    const distance = Phaser.Math.Distance.Between(this.x, this.y, objectX, objectY);
    if (distance >= this.visualRadius) return 0;
    if (distance <= this.radius) return 1;
    
    // Linear falloff from planet surface to field edge
    return 1 - ((distance - this.radius) / (this.visualRadius - this.radius));
  }

  /**
   * Calculate if an object would have a stable orbit at given position and velocity
   */
  public isStableOrbit(objectX: number, objectY: number, velocityX: number, velocityY: number): boolean {
    const distance = Phaser.Math.Distance.Between(this.x, this.y, objectX, objectY);
    const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    
    // Simplified orbital velocity calculation
    const orbitalVelocity = Math.sqrt(this.gravitationalConstant * this.mass / distance);
    
    // Check if velocity is within 20% of required orbital velocity
    return Math.abs(velocity - orbitalVelocity) < orbitalVelocity * 0.2;
  }

  public getMass(): number {
    return this.mass;
  }

  public getRadius(): number {
    return this.radius;
  }

  public getVisualRadius(): number {
    return this.visualRadius;
  }

  update(delta: number) {
    // Can add any dynamic behavior here if needed
  }
}
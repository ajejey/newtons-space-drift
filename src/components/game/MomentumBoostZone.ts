import * as Phaser from 'phaser';

export class MomentumBoostZone extends Phaser.GameObjects.Container {
  private zoneGraphics: Phaser.GameObjects.Graphics;
  private directionVector: Phaser.Math.Vector2;
  private boostFactor: number;
  private zoneRadius: number;
  private isActive: boolean = true;
  private activationCooldown: number = 0;
  private cooldownTime: number = 500; // 500ms cooldown between activations
  private pulseEffect: Phaser.Tweens.Tween | null = null;
  private particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    radius: number = 60,
    angle: number = 0, 
    boostFactor: number = 1.5
  ) {
    super(scene, x, y);
    scene.add.existing(this);
    
    this.zoneRadius = radius;
    this.boostFactor = boostFactor;
    
    // Calculate direction vector based on angle
    this.directionVector = new Phaser.Math.Vector2(
      Math.cos(Phaser.Math.DegToRad(angle)),
      Math.sin(Phaser.Math.DegToRad(angle))
    );
    
    // Create zone graphics
    this.zoneGraphics = this.scene.add.graphics();
    this.drawZone();
    this.add(this.zoneGraphics);
    
    // Add a label
    const label = this.scene.add.text(0, -radius - 15, 'BOOST ZONE', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '10px',
      color: '#00FF00',
      align: 'center'
    });
    label.setOrigin(0.5);
    this.add(label);
    
    // Set depth to be behind player but above background
    this.setDepth(1);
    
    // Create particle effect
    this.createParticleEffect();
    
    // Create pulsing animation
    this.createPulseEffect();
  }
  
  private drawZone() {
    this.zoneGraphics.clear();
    
    // Zone circle
    this.zoneGraphics.fillStyle(0x00FF00, 0.2);
    this.zoneGraphics.fillCircle(0, 0, this.zoneRadius);
    
    // Zone border
    this.zoneGraphics.lineStyle(2, 0x00FF00, 0.7);
    this.zoneGraphics.strokeCircle(0, 0, this.zoneRadius);
    
    // Direction indicator
    const arrowLength = this.zoneRadius * 0.7;
    this.zoneGraphics.lineStyle(3, 0x00FF00, 0.8);
    this.zoneGraphics.beginPath();
    
    // Calculate arrow start and end points
    const startX = -this.directionVector.x * arrowLength * 0.3;
    const startY = -this.directionVector.y * arrowLength * 0.3;
    const endX = this.directionVector.x * arrowLength * 0.7;
    const endY = this.directionVector.y * arrowLength * 0.7;
    
    this.zoneGraphics.moveTo(startX, startY);
    this.zoneGraphics.lineTo(endX, endY);
    this.zoneGraphics.strokePath();
    
    // Arrow head
    const headSize = 10;
    const angle = Math.atan2(this.directionVector.y, this.directionVector.x);
    
    this.zoneGraphics.lineStyle(3, 0x00FF00, 0.8);
    this.zoneGraphics.beginPath();
    this.zoneGraphics.moveTo(endX, endY);
    this.zoneGraphics.lineTo(
      endX - headSize * Math.cos(angle - Math.PI/6),
      endY - headSize * Math.sin(angle - Math.PI/6)
    );
    this.zoneGraphics.moveTo(endX, endY);
    this.zoneGraphics.lineTo(
      endX - headSize * Math.cos(angle + Math.PI/6),
      endY - headSize * Math.sin(angle + Math.PI/6)
    );
    this.zoneGraphics.strokePath();
  }
  
  private createParticleEffect() {
    // Create particle texture if it doesn't exist
    if (!this.scene.game.textures.exists('boost-particle')) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0x00FF00, 1);
      graphics.fillCircle(4, 4, 4);
      graphics.generateTexture('boost-particle', 8, 8);
      graphics.destroy();
    }
    
    // In Phaser 3.60+, particles are created differently
    // Calculate angle range based on direction vector
    const angleBase = Phaser.Math.RadToDeg(Math.atan2(this.directionVector.y, this.directionVector.x));
    
    // Create a particle emitter configuration
    const emitterConfig = {
      x: this.x,
      y: this.y,
      speed: { min: 10, max: 30 },
      angle: { min: angleBase - 15, max: angleBase + 15 },
      scale: { start: 0.4, end: 0 },
      blendMode: 'ADD',
      lifespan: 800,
      gravityY: 0,
      frequency: 100,
      quantity: 1
    };
    
    // Create the particle emitter directly
    this.particleEmitter = this.scene.add.particles(this.x, this.y, 'boost-particle', emitterConfig);
  }
  
  private createPulseEffect() {
    // Create pulsing effect for better visibility
    this.pulseEffect = this.scene.tweens.add({
      targets: this.zoneGraphics,
      alpha: { from: 0.7, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1
    });
  }
  
  update(time: number, delta: number) {
    // Update cooldown timer
    if (!this.isActive) {
      this.activationCooldown -= delta;
      if (this.activationCooldown <= 0) {
        this.isActive = true;
        this.setAlpha(1);
        
        // Restart pulse effect
        if (this.pulseEffect && !this.pulseEffect.isPlaying()) {
          this.pulseEffect.restart();
        }
      }
    }
    
    // Update particle emitter position if the zone moves
    if (this.particleEmitter) {
      this.particleEmitter.setPosition(this.x, this.y);
    }
  }
  
  /**
   * Check if an object is within the boost zone
   * @param objectX The x position of the object
   * @param objectY The y position of the object
   * @param velocity The current velocity of the object
   * @returns Modified velocity if in boost zone, null otherwise
   */
  checkBoost(
    objectX: number, 
    objectY: number, 
    velocity: { x: number, y: number }
  ): { x: number, y: number } | null {
    if (!this.isActive) return null;
    
    // Calculate distance from object to zone center
    const dx = objectX - this.x;
    const dy = objectY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if object is within the zone
    if (distance < this.zoneRadius) {
      // Activate the boost
      this.activateBoost();
      
      // Calculate new velocity based on boost direction and factor
      const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      const newVelocity = {
        x: this.directionVector.x * currentSpeed * this.boostFactor,
        y: this.directionVector.y * currentSpeed * this.boostFactor
      };
      
      return newVelocity;
    }
    
    return null;
  }
  
  private activateBoost() {
    // Set cooldown
    this.isActive = false;
    this.activationCooldown = this.cooldownTime;
    
    // Visual feedback
    this.setAlpha(0.5);
    if (this.pulseEffect) {
      this.pulseEffect.pause();
    }
    
    // Particle burst - in Phaser 3.60+, we use emitParticle instead of explode
    if (this.particleEmitter) {
      // Emit multiple particles at once for a burst effect
      for (let i = 0; i < 15; i++) {
        this.particleEmitter.emitParticle();
      }
    }
    
    // Play sound effect if available
    if (this.scene.sound && this.scene.sound.add) {
      // Check if sound exists to avoid errors
      if (this.scene.game.cache.audio.exists('boost-sound')) {
        const sound = this.scene.sound.add('boost-sound');
        sound.play({ volume: 0.4 });
      }
    }
  }
  
  public setBoostFactor(factor: number) {
    this.boostFactor = factor;
  }
  
  public getDirection(): Phaser.Math.Vector2 {
    return this.directionVector;
  }
  
  destroy() {
    if (this.pulseEffect) {
      this.pulseEffect.stop();
    }
    
    if (this.particleEmitter) {
      this.particleEmitter.stop();
      // In Phaser 3.60+, we destroy the particle emitter directly
      this.particleEmitter.destroy();
    }
    
    super.destroy();
  }
}

import * as Phaser from 'phaser';

export class MomentumTransferGate extends Phaser.GameObjects.Container {
  private gateGraphics: Phaser.GameObjects.Graphics;
  private directionVector: Phaser.Math.Vector2;
  private conservationFactor: number;
  private gateWidth: number;
  private gateHeight: number;
  private isActive: boolean = true;
  private activationCooldown: number = 0;
  private cooldownTime: number = 1000; // 1 second cooldown between activations
  private pulseEffect: Phaser.Tweens.Tween | null = null;
  private particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    width: number = 80, 
    height: number = 20,
    angle: number = 0, 
    conservationFactor: number = 1.0
  ) {
    super(scene, x, y);
    scene.add.existing(this);
    
    this.gateWidth = width;
    this.gateHeight = height;
    this.conservationFactor = conservationFactor;
    
    // Calculate direction vector based on angle
    this.directionVector = new Phaser.Math.Vector2(
      Math.cos(Phaser.Math.DegToRad(angle)),
      Math.sin(Phaser.Math.DegToRad(angle))
    );
    
    // Create gate graphics
    this.gateGraphics = this.scene.add.graphics();
    this.drawGate();
    this.add(this.gateGraphics);
    
    // Add a label
    const label = this.scene.add.text(0, -height/2 - 15, 'MOMENTUM GATE', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '10px',
      color: '#FF6600',
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
    
    // Set rotation based on angle
    this.setRotation(Phaser.Math.DegToRad(angle));
  }
  
  private drawGate() {
    this.gateGraphics.clear();
    
    // Gate body
    this.gateGraphics.fillStyle(0xFF6600, 0.3);
    this.gateGraphics.fillRect(-this.gateWidth/2, -this.gateHeight/2, this.gateWidth, this.gateHeight);
    
    // Gate border
    this.gateGraphics.lineStyle(2, 0xFF6600, 0.8);
    this.gateGraphics.strokeRect(-this.gateWidth/2, -this.gateHeight/2, this.gateWidth, this.gateHeight);
    
    // Direction indicator
    const arrowLength = this.gateWidth * 0.4;
    this.gateGraphics.lineStyle(3, 0xFF6600, 0.8);
    this.gateGraphics.beginPath();
    this.gateGraphics.moveTo(-arrowLength/2, 0);
    this.gateGraphics.lineTo(arrowLength/2, 0);
    this.gateGraphics.strokePath();
    
    // Arrow head
    this.gateGraphics.lineStyle(3, 0xFF6600, 0.8);
    this.gateGraphics.beginPath();
    this.gateGraphics.moveTo(arrowLength/2, 0);
    this.gateGraphics.lineTo(arrowLength/2 - 10, -5);
    this.gateGraphics.moveTo(arrowLength/2, 0);
    this.gateGraphics.lineTo(arrowLength/2 - 10, 5);
    this.gateGraphics.strokePath();
  }
  
  private createParticleEffect() {
    // Create particle texture if it doesn't exist
    if (!this.scene.game.textures.exists('gate-particle')) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xFF6600, 1);
      graphics.fillCircle(4, 4, 4);
      graphics.generateTexture('gate-particle', 8, 8);
      graphics.destroy();
    }
    
    // In Phaser 3.60+, particles are created differently
    // Create a particle emitter manager
    const emitterConfig = {
      x: this.x,
      y: this.y,
      speed: { min: 20, max: 40 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 600,
      gravityY: 0,
      frequency: 50,
      quantity: 1
    };
    
    // Create the particle emitter directly
    this.particleEmitter = this.scene.add.particles(this.x, this.y, 'gate-particle', emitterConfig);
  }
  
  private createPulseEffect() {
    // Create pulsing effect for better visibility
    this.pulseEffect = this.scene.tweens.add({
      targets: this.gateGraphics,
      alpha: { from: 0.8, to: 1 },
      duration: 1500,
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
    
    // Update particle emitter position if the gate moves
    if (this.particleEmitter) {
      this.particleEmitter.setPosition(this.x, this.y);
    }
  }
  
  /**
   * Check if an object is passing through the gate
   * @param object The game object to check
   * @param velocity The current velocity of the object
   * @returns Modified velocity if passing through, null otherwise
   */
  checkGatePass(
    objectX: number, 
    objectY: number, 
    velocity: { x: number, y: number }, 
    objectRadius: number = 20
  ): { x: number, y: number } | null {
    if (!this.isActive) return null;
    
    // Calculate distance from object to gate center
    const dx = objectX - this.x;
    const dy = objectY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if object is close enough to the gate
    if (distance < this.gateWidth / 2 + objectRadius) {
      // Calculate the gate's normal vector (perpendicular to direction)
      const normalVector = new Phaser.Math.Vector2(-this.directionVector.y, this.directionVector.x);
      
      // Calculate dot product to determine if object is passing through the gate
      // (rather than just being near it)
      const approachVelocity = new Phaser.Math.Vector2(velocity.x, velocity.y);
      const dotProduct = approachVelocity.dot(this.directionVector);
      
      // Object must be moving toward the gate with sufficient velocity
      if (Math.abs(dotProduct) > 5) {
        // Trigger gate activation
        this.activateGate();
        
        // Calculate new velocity based on conservation of momentum
        // Reflect velocity along the gate's direction vector and apply conservation factor
        const newVelocity = {
          x: this.directionVector.x * Math.abs(dotProduct) * this.conservationFactor,
          y: this.directionVector.y * Math.abs(dotProduct) * this.conservationFactor
        };
        
        return newVelocity;
      }
    }
    
    return null;
  }
  
  private activateGate() {
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
      for (let i = 0; i < 20; i++) {
        this.particleEmitter.emitParticle();
      }
    }
    
    // Play sound effect if available
    if (this.scene.sound && this.scene.sound.add) {
      // Check if sound exists to avoid errors
      if (this.scene.game.cache.audio.exists('gate-sound')) {
        const sound = this.scene.sound.add('gate-sound');
        sound.play({ volume: 0.5 });
      }
    }
  }
  
  public setConservationFactor(factor: number) {
    this.conservationFactor = factor;
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

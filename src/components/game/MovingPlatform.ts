import * as Phaser from 'phaser';

export class MovingPlatform extends Phaser.GameObjects.Container {
  private platformGraphics: Phaser.GameObjects.Graphics;
  private platformWidth: number;
  private platformHeight: number;
  private startPoint: Phaser.Math.Vector2;
  private endPoint: Phaser.Math.Vector2;
  private moveSpeed: number;
  private currentDirection: number = 1; // 1 for forward, -1 for backward
  private platformColor: number;
  private platformAlpha: number;
  private isActive: boolean = true;
  private lastCollisionTime: number = 0;
  private collisionCooldown: number = 500; // 500ms cooldown between collisions
  
  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    width: number = 100, 
    height: number = 20,
    endX: number, 
    endY: number,
    moveSpeed: number = 1,
    color: number = 0x00AAFF
  ) {
    super(scene, x, y);
    scene.add.existing(this);
    
    this.platformWidth = width;
    this.platformHeight = height;
    this.moveSpeed = moveSpeed;
    this.platformColor = color;
    this.platformAlpha = 0.7;
    
    // Set start and end points
    this.startPoint = new Phaser.Math.Vector2(x, y);
    this.endPoint = new Phaser.Math.Vector2(endX, endY);
    
    // Create platform graphics
    this.platformGraphics = this.scene.add.graphics();
    this.drawPlatform();
    this.add(this.platformGraphics);
    
    // Add a label
    const label = this.scene.add.text(0, -height/2 - 15, 'MOMENTUM PLATFORM', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '10px',
      color: '#00AAFF',
      align: 'center'
    });
    label.setOrigin(0.5);
    this.add(label);
    
    // Set depth to be behind player but above background
    this.setDepth(1);
    
    // Create pulsing animation
    this.createPulseEffect();
  }
  
  private drawPlatform() {
    this.platformGraphics.clear();
    
    // Platform body
    this.platformGraphics.fillStyle(this.platformColor, this.platformAlpha);
    this.platformGraphics.fillRect(-this.platformWidth/2, -this.platformHeight/2, this.platformWidth, this.platformHeight);
    
    // Platform border
    this.platformGraphics.lineStyle(2, this.platformColor, 0.9);
    this.platformGraphics.strokeRect(-this.platformWidth/2, -this.platformHeight/2, this.platformWidth, this.platformHeight);
    
    // Direction indicators (small arrows showing movement direction)
    const arrowSpacing = 30;
    const arrowSize = 8;
    const numArrows = Math.floor(this.platformWidth / arrowSpacing) - 1;
    
    this.platformGraphics.lineStyle(2, this.platformColor, 0.9);
    
    for (let i = 0; i < numArrows; i++) {
      const arrowX = -this.platformWidth/2 + arrowSpacing * (i + 1);
      const arrowY = 0;
      
      // Draw arrow line
      this.platformGraphics.beginPath();
      this.platformGraphics.moveTo(arrowX - arrowSize, arrowY);
      this.platformGraphics.lineTo(arrowX + arrowSize, arrowY);
      this.platformGraphics.strokePath();
      
      // Draw arrow head
      this.platformGraphics.beginPath();
      this.platformGraphics.moveTo(arrowX + arrowSize, arrowY);
      this.platformGraphics.lineTo(arrowX, arrowY - arrowSize/2);
      this.platformGraphics.moveTo(arrowX + arrowSize, arrowY);
      this.platformGraphics.lineTo(arrowX, arrowY + arrowSize/2);
      this.platformGraphics.strokePath();
    }
  }
  
  private createPulseEffect() {
    // Create pulsing effect for better visibility
    this.scene.tweens.add({
      targets: this.platformGraphics,
      alpha: { from: 0.7, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1
    });
  }
  
  update(time: number, delta: number) {
    if (!this.isActive) return;
    
    // Calculate movement vector
    const moveVector = new Phaser.Math.Vector2(
      this.endPoint.x - this.startPoint.x,
      this.endPoint.y - this.startPoint.y
    );
    
    // Normalize and scale by speed
    moveVector.normalize();
    moveVector.scale(this.moveSpeed * delta * 0.01);
    
    // Apply movement based on current direction
    this.x += moveVector.x * this.currentDirection;
    this.y += moveVector.y * this.currentDirection;
    
    // Check if we've reached an endpoint
    const distanceToStart = Phaser.Math.Distance.Between(
      this.x, this.y, this.startPoint.x, this.startPoint.y
    );
    
    const distanceToEnd = Phaser.Math.Distance.Between(
      this.x, this.y, this.endPoint.x, this.endPoint.y
    );
    
    // Change direction if we've reached an endpoint
    const totalDistance = Phaser.Math.Distance.Between(
      this.startPoint.x, this.startPoint.y, this.endPoint.x, this.endPoint.y
    );
    
    if (distanceToStart > totalDistance || distanceToEnd > totalDistance) {
      this.currentDirection *= -1;
    }
  }
  
  /**
   * Check if an object is colliding with the platform
   * @param objectX The x position of the object
   * @param objectY The y position of the object
   * @param velocity The current velocity of the object
   * @param objectRadius The radius of the object for collision detection
   * @returns Modified velocity if colliding, null otherwise
   */
  checkCollision(
    objectX: number, 
    objectY: number, 
    velocity: { x: number, y: number }, 
    objectRadius: number = 20
  ): { x: number, y: number } | null {
    const currentTime = this.scene.time.now;
    
    // Skip if on cooldown
    if (currentTime - this.lastCollisionTime < this.collisionCooldown) {
      return null;
    }
    
    // Calculate distance from object to platform center
    const dx = objectX - this.x;
    const dy = objectY - this.y;
    
    // Check if object is within platform bounds (simple rectangle collision)
    if (
      Math.abs(dx) < this.platformWidth/2 + objectRadius && 
      Math.abs(dy) < this.platformHeight/2 + objectRadius
    ) {
      // Calculate platform movement vector
      const moveVector = new Phaser.Math.Vector2(
        this.endPoint.x - this.startPoint.x,
        this.endPoint.y - this.startPoint.y
      );
      moveVector.normalize();
      moveVector.scale(this.moveSpeed * this.currentDirection);
      
      // Calculate new velocity based on conservation of momentum
      // Add platform velocity to object velocity
      const newVelocity = {
        x: velocity.x + moveVector.x * 2, // Amplify effect for gameplay
        y: velocity.y + moveVector.y * 2
      };
      
      // Set collision cooldown
      this.lastCollisionTime = currentTime;
      
      // Visual feedback
      this.flash();
      
      return newVelocity;
    }
    
    return null;
  }
  
  private flash() {
    // Flash effect for collision feedback
    this.scene.tweens.add({
      targets: this.platformGraphics,
      alpha: { from: 1, to: 0.3 },
      duration: 100,
      yoyo: true,
      repeat: 1
    });
    
    // Play sound effect if available
    if (this.scene.sound && this.scene.sound.add) {
      // Check if sound exists to avoid errors
      if (this.scene.game.cache.audio.exists('platform-sound')) {
        const sound = this.scene.sound.add('platform-sound');
        sound.play({ volume: 0.3 });
      }
    }
  }
  
  public getVelocity(): Phaser.Math.Vector2 {
    // Calculate current velocity vector of the platform
    const moveVector = new Phaser.Math.Vector2(
      this.endPoint.x - this.startPoint.x,
      this.endPoint.y - this.startPoint.y
    );
    moveVector.normalize();
    moveVector.scale(this.moveSpeed * this.currentDirection);
    
    return moveVector;
  }
  
  public setActive(active: boolean) {
    this.isActive = active;
    this.setAlpha(active ? 1 : 0.5);
  }
  
  destroy() {
    super.destroy();
  }
}

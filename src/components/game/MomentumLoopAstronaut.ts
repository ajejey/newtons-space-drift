import * as Phaser from 'phaser';
import { RescueTarget } from './RescueTarget';

export class MomentumLoopAstronaut extends RescueTarget {
  private orbitPath: Phaser.Curves.Ellipse;
  private orbitProgress: number = 0;
  private orbitSpeed: number = 0.005;
  private orbitCenterX: number;
  private orbitCenterY: number;
  private orbitRadiusX: number;
  private orbitRadiusY: number;
  private pathGraphics: Phaser.GameObjects.Graphics;
  private requiredMomentum: number;
  private momentumDirection: Phaser.Math.Vector2;
  private momentumTolerance: number = 0.3; // How close the player's momentum needs to match
  private rescueHintText: Phaser.GameObjects.Text;
  private rescueHintVisible: boolean = false;
  private rescueHintTimer: number = 0;
  private rescueHintDuration: number = 3000; // 3 seconds

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    texture: string,
    centerX: number,
    centerY: number,
    radiusX: number = 100,
    radiusY: number = 80,
    requiredMomentum: number = 50,
    momentumAngle: number = 0
  ) {
    super(scene, x, y, texture);
    
    // Set orbit parameters
    this.orbitCenterX = centerX;
    this.orbitCenterY = centerY;
    this.orbitRadiusX = radiusX;
    this.orbitRadiusY = radiusY;
    this.requiredMomentum = requiredMomentum;
    
    // Calculate momentum direction vector
    this.momentumDirection = new Phaser.Math.Vector2(
      Math.cos(Phaser.Math.DegToRad(momentumAngle)),
      Math.sin(Phaser.Math.DegToRad(momentumAngle))
    );
    
    // Create orbit path
    this.orbitPath = new Phaser.Curves.Ellipse(
      this.orbitCenterX,
      this.orbitCenterY,
      this.orbitRadiusX,
      this.orbitRadiusY
    );
    
    // Create path graphics
    this.pathGraphics = this.scene.add.graphics();
    this.drawOrbitPath();
    
    // Create rescue hint text
    this.rescueHintText = this.scene.add.text(0, -40, 'Match momentum to rescue!', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '12px',
      color: '#FFFFFF',
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 }
    });
    this.rescueHintText.setOrigin(0.5);
    this.rescueHintText.setVisible(false);
    
    // Set random starting position on the orbit
    this.orbitProgress = Math.random();
    this.updatePosition();
  }
  
  private drawOrbitPath() {
    this.pathGraphics.clear();
    this.pathGraphics.lineStyle(1, 0x00FF00, 0.4);
    this.orbitPath.draw(this.pathGraphics);
    this.pathGraphics.setDepth(1);
  }
  
  update(delta: number) {
    if (this.isRescued()) {
      // If rescued, follow the player
      super.update(delta);
    } else {
      // Update orbit progress
      this.orbitProgress += this.orbitSpeed * delta * 0.01;
      if (this.orbitProgress >= 1) {
        this.orbitProgress -= 1;
      }
      
      // Update position on orbit
      this.updatePosition();
      
      // Update rescue hint timer
      if (this.rescueHintVisible) {
        this.rescueHintTimer -= delta;
        if (this.rescueHintTimer <= 0) {
          this.hideRescueHint();
        }
      }
      
      // Update hint text position
      this.rescueHintText.setPosition(this.x, this.y - 40);
    }
  }
  
  private updatePosition() {
    // Get position on orbit path
    const point = this.orbitPath.getPoint(this.orbitProgress);
    this.x = point.x;
    this.y = point.y;
    
    // Calculate tangent to orbit for rotation
    const tangent = this.orbitPath.getTangent(this.orbitProgress);
    const angle = Math.atan2(tangent.y, tangent.x) + Math.PI/2;
    this.setRotation(angle);
  }
  
  /**
   * Check if player can rescue this astronaut based on momentum
   * @param playerVelocity The player's current velocity
   * @param playerMass The player's current mass
   * @returns Whether the player can rescue this astronaut
   */
  canBeRescued(playerVelocity: { x: number, y: number }, playerMass: number): boolean {
    if (this.isRescued()) return false;
    
    // Calculate player momentum magnitude
    const playerSpeed = Math.sqrt(playerVelocity.x * playerVelocity.x + playerVelocity.y * playerVelocity.y);
    const playerMomentum = playerSpeed * playerMass;
    
    // Calculate player momentum direction
    const playerDirection = new Phaser.Math.Vector2(
      playerVelocity.x / playerSpeed,
      playerVelocity.y / playerSpeed
    );
    
    // Calculate dot product to determine direction similarity
    const dotProduct = playerDirection.dot(this.momentumDirection);
    
    // Check if momentum and direction match requirements
    const momentumMatch = Math.abs(playerMomentum - this.requiredMomentum) < this.requiredMomentum * this.momentumTolerance;
    const directionMatch = dotProduct > (1 - this.momentumTolerance);
    
    return momentumMatch && directionMatch;
  }
  
  /**
   * Show a hint about the required momentum to rescue this astronaut
   */
  showRescueHint() {
    // Only show hint if not already visible
    if (!this.rescueHintVisible) {
      this.rescueHintVisible = true;
      this.rescueHintTimer = this.rescueHintDuration;
      
      // Format the momentum value
      const momentumValue = Math.round(this.requiredMomentum);
      
      // Convert direction vector to angle in degrees
      const directionAngle = Phaser.Math.RadToDeg(
        Math.atan2(this.momentumDirection.y, this.momentumDirection.x)
      );
      
      // Update hint text
      this.rescueHintText.setText(`Need momentum: ~${momentumValue}\nDirection: ${Math.round(directionAngle)}°`);
      this.rescueHintText.setVisible(true);
      
      // Add a fade-in effect
      this.rescueHintText.setAlpha(0);
      this.scene.tweens.add({
        targets: this.rescueHintText,
        alpha: 1,
        duration: 200,
        ease: 'Power1'
      });
    }
  }
  
  private hideRescueHint() {
    if (this.rescueHintVisible) {
      this.rescueHintVisible = false;
      
      // Add a fade-out effect
      this.scene.tweens.add({
        targets: this.rescueHintText,
        alpha: 0,
        duration: 200,
        ease: 'Power1',
        onComplete: () => {
          this.rescueHintText.setVisible(false);
        }
      });
    }
  }
  
  rescue() {
    super.rescue();
    
    // Hide orbit path when rescued
    this.pathGraphics.clear();
    
    // Hide rescue hint
    this.hideRescueHint();
  }
  
  destroy() {
    this.pathGraphics.destroy();
    this.rescueHintText.destroy();
    super.destroy();
  }
  
  /**
   * Get the required momentum to rescue this astronaut
   */
  getRequiredMomentum(): number {
    return this.requiredMomentum;
  }
  
  /**
   * Get the required momentum direction to rescue this astronaut
   */
  getRequiredMomentumDirection(): Phaser.Math.Vector2 {
    return this.momentumDirection;
  }
}

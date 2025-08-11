import * as Phaser from 'phaser';

export class RescueTarget extends Phaser.GameObjects.Sprite {
  private rescued = false;
  private floatTween?: Phaser.Tweens.Tween;
  private pulseGlow?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    
    scene.add.existing(this);
    this.setOrigin(0.5);
    this.setDepth(5);
    
    // Create floating animation
    this.createFloatingAnimation();
    
    // Create rescue glow effect
    this.createRescueGlow();
  }

  private createFloatingAnimation() {
    // Gentle floating motion to show object is in zero gravity
    this.floatTween = this.scene.tweens.add({
      targets: this,
      y: this.y + Phaser.Math.Between(-10, 10),
      rotation: this.rotation + Phaser.Math.FloatBetween(-0.1, 0.1),
      duration: Phaser.Math.Between(2000, 4000),
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  private createRescueGlow() {
    // Create a subtle glow to indicate this is a rescue target
    this.pulseGlow = this.scene.add.graphics();
    this.pulseGlow.setDepth(4);
    
    this.scene.tweens.add({
      targets: this.pulseGlow,
      alpha: { from: 0.3, to: 0.8 },
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  update(delta: number) {
    if (this.rescued) return;
    
    // Update glow position
    if (this.pulseGlow) {
      this.pulseGlow.clear();
      this.pulseGlow.lineStyle(3, 0x00FF88, this.pulseGlow.alpha);
      this.pulseGlow.strokeCircle(this.x, this.y, 25);
    }
  }

  public rescue() {
    if (this.rescued) return;
    
    this.rescued = true;
    
    // Stop floating animation
    if (this.floatTween) {
      this.floatTween.destroy();
    }
    
    // Remove glow
    if (this.pulseGlow) {
      this.pulseGlow.destroy();
    }
    
    // Play rescue animation
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0 },
      scale: { from: 1, to: 1.5 },
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      }
    });
    
    // Create rescue particle effect
    this.createRescueParticles();
  }

  private createRescueParticles() {
    // Simple particle effect for rescue
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.circle(
        this.x + Phaser.Math.Between(-10, 10),
        this.y + Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(2, 4),
        0x00FFFF
      );
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-50, 50),
        y: particle.y + Phaser.Math.Between(-50, 50),
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0 },
        duration: 1000,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  public isRescued(): boolean {
    return this.rescued;
  }

  destroy() {
    if (this.floatTween) {
      this.floatTween.destroy();
    }
    if (this.pulseGlow) {
      this.pulseGlow.destroy();
    }
    super.destroy();
  }
}
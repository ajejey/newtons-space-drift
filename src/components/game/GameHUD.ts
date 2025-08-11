import * as Phaser from 'phaser';

export class GameHUD {
  private scene: Phaser.Scene;
  private hudElements: { [key: string]: Phaser.GameObjects.Text } = {};
  private velocityArrow?: Phaser.GameObjects.Graphics;
  private thrustArrow?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createHUD();
  }

  private createHUD() {
    const textStyle = {
      fontSize: '16px',
      fontFamily: 'Orbitron, monospace',
      color: '#00E5FF',
      stroke: '#0B1426',
      strokeThickness: 2
    };

    // Score
    this.hudElements.scoreLabel = this.scene.add.text(20, 20, 'SCORE:', textStyle);
    this.hudElements.scoreValue = this.scene.add.text(20, 45, '0', {
      ...textStyle,
      fontSize: '20px',
      color: '#FFFFFF'
    });

    // Fuel
    this.hudElements.fuelLabel = this.scene.add.text(20, 80, 'FUEL:', textStyle);
    this.hudElements.fuelValue = this.scene.add.text(20, 105, '100%', {
      ...textStyle,
      fontSize: '18px',
      color: '#00FF88'
    });

    // Time
    this.hudElements.timeLabel = this.scene.add.text(20, 140, 'TIME:', textStyle);
    this.hudElements.timeValue = this.scene.add.text(20, 165, '02:00', {
      ...textStyle,
      fontSize: '18px',
      color: '#FF6600'
    });

    // Velocity indicator (top-right)
    const gameWidth = this.scene.sys.game.config.width as number;
    this.hudElements.velocityLabel = this.scene.add.text(gameWidth - 150, 20, 'VELOCITY:', {
      ...textStyle,
      fontSize: '14px'
    });

    // Thrust indicator
    this.hudElements.thrustLabel = this.scene.add.text(gameWidth - 150, 80, 'THRUST:', {
      ...textStyle,
      fontSize: '14px'
    });

    // Create vector arrows
    this.velocityArrow = this.scene.add.graphics();
    this.thrustArrow = this.scene.add.graphics();
    
    // Set depth for HUD elements
    Object.values(this.hudElements).forEach(element => element.setDepth(100));
    this.velocityArrow.setDepth(100);
    this.thrustArrow.setDepth(100);
  }

  public update(gameState: {
    score: number;
    fuel: number;
    timeRemaining: number;
    velocity: { x: number; y: number };
    isThrusting: boolean;
  }) {
    // Update score
    this.hudElements.scoreValue.setText(gameState.score.toString());

    // Update fuel
    const fuelPercent = Math.max(0, gameState.fuel);
    this.hudElements.fuelValue.setText(`${Math.round(fuelPercent)}%`);
    
    // Change fuel color based on level
    if (fuelPercent > 50) {
      this.hudElements.fuelValue.setColor('#00FF88');
    } else if (fuelPercent > 25) {
      this.hudElements.fuelValue.setColor('#FFD700');
    } else {
      this.hudElements.fuelValue.setColor('#FF4444');
    }

    // Update time
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    this.hudElements.timeValue.setText(
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );

    // Update velocity vector arrow
    this.updateVelocityArrow(gameState.velocity);

    // Update thrust arrow when thrusting
    if (gameState.isThrusting) {
      this.updateThrustArrow();
    } else {
      this.thrustArrow.clear();
    }
  }

  private updateVelocityArrow(velocity: { x: number; y: number }) {
    this.velocityArrow.clear();
    
    const gameWidth = this.scene.sys.game.config.width as number;
    const arrowOriginX = gameWidth - 75;
    const arrowOriginY = 50;
    
    // Scale velocity for display
    const scale = 0.5;
    const arrowEndX = arrowOriginX + velocity.x * scale;
    const arrowEndY = arrowOriginY + velocity.y * scale;
    
    // Draw velocity arrow in cyan
    this.velocityArrow.lineStyle(3, 0x00E5FF);
    this.velocityArrow.strokeLineShape(
      new Phaser.Geom.Line(arrowOriginX, arrowOriginY, arrowEndX, arrowEndY)
    );
    
    // Draw arrowhead
    const angle = Math.atan2(velocity.y, velocity.x);
    const arrowLength = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y) * scale;
    
    if (arrowLength > 5) {
      const headLength = 8;
      const headAngle = Math.PI / 6;
      
      this.velocityArrow.fillStyle(0x00E5FF);
      this.velocityArrow.fillTriangle(
        arrowEndX,
        arrowEndY,
        arrowEndX - headLength * Math.cos(angle - headAngle),
        arrowEndY - headLength * Math.sin(angle - headAngle),
        arrowEndX - headLength * Math.cos(angle + headAngle),
        arrowEndY - headLength * Math.sin(angle + headAngle)
      );
    }
  }

  private updateThrustArrow() {
    this.thrustArrow.clear();
    
    const gameWidth = this.scene.sys.game.config.width as number;
    const arrowOriginX = gameWidth - 75;
    const arrowOriginY = 110;
    
    // Simple thrust indicator (pointing right for demo)
    this.thrustArrow.lineStyle(3, 0xFF6600);
    this.thrustArrow.fillStyle(0xFF6600);
    
    // Draw thrust arrow
    this.thrustArrow.strokeLineShape(
      new Phaser.Geom.Line(arrowOriginX, arrowOriginY, arrowOriginX + 30, arrowOriginY)
    );
    
    // Arrowhead
    this.thrustArrow.fillTriangle(
      arrowOriginX + 30, arrowOriginY,
      arrowOriginX + 22, arrowOriginY - 5,
      arrowOriginX + 22, arrowOriginY + 5
    );
  }

  public destroy() {
    Object.values(this.hudElements).forEach(element => element.destroy());
    this.velocityArrow?.destroy();
    this.thrustArrow?.destroy();
  }
}
import * as Phaser from 'phaser';

export class EducationalOverlay {
  private scene: Phaser.Scene;
  private overlay?: Phaser.GameObjects.Container;
  private background?: Phaser.GameObjects.Graphics;
  private titleText?: Phaser.GameObjects.Text;
  private descriptionText?: Phaser.GameObjects.Text;
  private closeButton?: Phaser.GameObjects.Text;
  private isVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public show(title: string, description: string, autoHide = false) {
    if (this.isVisible) {
      this.hide();
      // Add a small delay before showing the new overlay to ensure proper cleanup
      this.scene.time.delayedCall(100, () => {
        this.createOverlayInternal(title, description, autoHide);
      });
    } else {
      this.createOverlayInternal(title, description, autoHide);
    }
  }

  private createOverlayInternal(title: string, description: string, autoHide = false) {
    this.createOverlay(title, description, autoHide);
    this.isVisible = true;

    if (autoHide) {
      this.scene.time.delayedCall(3000, () => {
        if (this.isVisible) {
          this.hide();
        }
      });
    }
  }

  private createOverlay(title: string, description: string, autoHide = false) {
    const gameWidth = this.scene.sys.game.config.width as number;
    const gameHeight = this.scene.sys.game.config.height as number;

    // Create container
    this.overlay = this.scene.add.container(gameWidth / 2, gameHeight / 2);
    this.overlay.setDepth(200);

    // Semi-transparent background
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x0B1426, 0.9);
    this.background.fillRoundedRect(-200, -100, 400, 200, 16);
    this.background.lineStyle(3, 0x00E5FF);
    this.background.strokeRoundedRect(-200, -100, 400, 200, 16);

    // Title text
    this.titleText = this.scene.add.text(0, -60, title, {
      fontSize: '24px',
      fontFamily: 'Orbitron, monospace',
      color: '#00E5FF',
      align: 'center'
    });
    this.titleText.setOrigin(0.5);

    // Description text
    this.descriptionText = this.scene.add.text(0, -10, description, {
      fontSize: '16px',
      fontFamily: 'Orbitron, monospace',
      color: '#FFFFFF',
      align: 'center',
      wordWrap: { width: 360, useAdvancedWrap: true }
    });
    this.descriptionText.setOrigin(0.5);

    // Close button - only show for non-auto-hide overlays
    if (!autoHide) {
      this.closeButton = this.scene.add.text(0, 60, 'PRESS SPACE TO CONTINUE', {
        fontSize: '14px',
        fontFamily: 'Orbitron, monospace',
        color: '#FF6600',
        align: 'center'
      });
      this.closeButton.setOrigin(0.5);
      this.closeButton.setInteractive({ useHandCursor: true });
      this.closeButton.on('pointerdown', () => this.hide());

      // Add pulsing effect to close button
      this.scene.tweens.add({
        targets: this.closeButton,
        alpha: { from: 0.7, to: 1 },
        duration: 800,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    }

    // Add all elements to container
    const elements = [this.background, this.titleText, this.descriptionText];
    if (this.closeButton) elements.push(this.closeButton);
    this.overlay.add(elements);

    // Entrance animation
    this.overlay.setScale(0);
    this.overlay.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.overlay,
      scale: { from: 0, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Back.easeOut'
    });

    // Only setup keyboard listener for non-auto-hide overlays
    if (!autoHide) {
      // Setup keyboard listener for spacebar
      const spaceKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      if (spaceKey) {
        const onSpacePress = () => {
          if (this.isVisible) {
            this.hide();
            spaceKey.off('down', onSpacePress);
          }
        };
        spaceKey.on('down', onSpacePress);
      }

      // Click anywhere to close (keep as fallback)
      this.scene.input.once('pointerdown', () => {
        if (this.isVisible) {
          this.hide();
        }
      });
    }
  }

  public hide() {
    if (!this.isVisible || !this.overlay) return;

    this.isVisible = false;

    // Exit animation
    this.scene.tweens.add({
      targets: this.overlay,
      scale: { from: 1, to: 0 },
      alpha: { from: 1, to: 0 },
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.overlay?.destroy();
        this.overlay = undefined;
      }
    });
  }

  public showNewtonLaw(lawNumber: 1 | 2 | 3, context: string) {
    const laws = {
      1: {
        title: "Newton's 1st Law - Inertia",
        description: `An object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force.\n\n${context}`
      },
      2: {
        title: "Newton's 2nd Law - F=ma",
        description: `The acceleration of an object is directly proportional to the force applied and inversely proportional to its mass.\n\n${context}`
      },
      3: {
        title: "Newton's 3rd Law - Action/Reaction",
        description: `For every action, there is an equal and opposite reaction.\n\n${context}`
      }
    };

    const law = laws[lawNumber];
    this.show(law.title, law.description, true);
  }

  public isOverlayVisible(): boolean {
    return this.isVisible;
  }

  public destroy() {
    this.hide();
  }
}
import * as Phaser from 'phaser';
import { PlayerPod } from './PlayerPod';
import { RescueTarget } from './RescueTarget';
import { Debris } from './Debris';
import { PhysicsEngine } from './PhysicsEngine';
import { GameHUD } from './GameHUD';
import { EducationalOverlay } from './EducationalOverlay';
import { GravityWell } from './GravityWell';
import { TrajectoryHelper } from './TrajectoryHelper';

export class GameScene extends Phaser.Scene {
  private player!: PlayerPod;
  private rescueTargets: RescueTarget[] = [];
  private debris: Debris[] = [];
  private towedAstronauts: RescueTarget[] = [];
  private physicsEngine!: PhysicsEngine;
  private gameHUD!: GameHUD;
  private educationalOverlay!: EducationalOverlay;
  private rescueStation!: Phaser.GameObjects.Container;
  private gravityWells: GravityWell[] = [];
  private trajectoryHelper!: TrajectoryHelper;
  private lastTrajectoryTime = 0;
  
  // Game state
  private score = 0;
  private fuel = 100;
  private timeRemaining = 120; // 2 minutes
  private level = 1;
  private gameStarted = false;
  private totalAstronautsRescued = 0;
  
  // Input handling
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: any;
  private rescueKey!: Phaser.Input.Keyboard.Key;
  
  // Mobile controls
  private mobileControls = {
    up: false,
    down: false,
    left: false,
    right: false,
    rescue: false
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Load game assets
    this.load.image('starfield', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    
    // Load player ship
    this.load.image('player-ship', 'assets/images/player-ship.svg');
    
    // Load astronaut
    this.load.image('astronaut-sprite', 'assets/images/astronaut.svg');
    
    // Load space debris
    this.load.image('debris-sprite', 'assets/images/space-debris.svg');
    
    // Load thruster flames
    this.load.image('thruster-up', 'assets/images/thrusters/thruster-up.svg');
    this.load.image('thruster-down', 'assets/images/thrusters/thruster-down.svg');
    this.load.image('thruster-left', 'assets/images/thrusters/thruster-left.svg');
    this.load.image('thruster-right', 'assets/images/thrusters/thruster-right.svg');
    
    // Create simple colored shapes for other game objects
    this.createSimpleSprites();
  }

  create() {
    // Initialize physics engine
    this.physicsEngine = new PhysicsEngine(this);
    
    // Create starfield background
    this.createStarfield();
    
    // Create rescue station marker at center
    this.createRescueStation();
    
    // Create player
    this.player = new PlayerPod(this, 400, 300);
    
    // Add player to physics engine for gravity effects
    this.physicsEngine.addBody(this.player, { 
      mass: 1, 
      affectedByGravity: true,
      velocity: { x: 0, y: 0 }
    });
    
    // Create rescue targets
    this.createRescueTargets();
    
    // Setup input
    this.setupInput();
    
    // Create HUD
    this.gameHUD = new GameHUD(this);
    
    // Create educational overlay
    this.educationalOverlay = new EducationalOverlay(this);
    
    // Create trajectory helper (only used in Level 3)
    this.trajectoryHelper = new TrajectoryHelper(this);
    
    // Start game timer
    this.startGameTimer();
    
    this.gameStarted = true;
  }

  update(time: number, delta: number) {
    if (!this.gameStarted) return;
    
    // Update physics
    this.physicsEngine.update(delta);
    
    // Handle input
    this.handleInput();
    
    // Update player
    this.player.update(delta, this.mobileControls);
    
    // Update rescue targets
    this.rescueTargets.forEach(target => target.update(delta));
    
    // Update debris
    this.debris.forEach(debris => debris.update(delta));
    
    // Update towed astronauts
    this.towedAstronauts.forEach(astronaut => astronaut.update(delta));
    
    // Check collisions
    this.checkCollisions();
    
    // Update HUD
    this.gameHUD.update({
      score: this.score,
      fuel: this.fuel,
      timeRemaining: this.timeRemaining,
      velocity: this.player.getVelocity(),
      isThrusting: this.player.isThrusting()
    });
    
  // Check win/lose conditions
    this.checkGameState();
    
    // Update gravity wells if present
    this.gravityWells.forEach(gravityWell => gravityWell.update(delta));
    
    // Check for gravity field interactions in Level 3
    if (this.level === 3 && this.gameStarted) {
      this.checkGravityInteractions();
    }
    
    // Show trajectory prediction in Level 3 when player is moving but not thrusting
    if (this.level === 3 && this.gameStarted && !this.player.isThrusting()) {
      this.updateTrajectoryHelper(time);
    }
  }

  private createSimpleSprites() {
    // Create colored rectangles for game sprites
    const graphics = this.add.graphics();
    
    // Player pod - now using the loaded SVG image
    // We're using the player-ship image directly in PlayerPod class
    // No need to generate a texture for player-pod anymore
    
    // Astronaut - now using the loaded SVG image
    // No need to generate a texture for astronaut anymore
    // The astronaut sprite will be used directly
    
    // Thruster flame (orange)
    graphics.clear();
    graphics.fillStyle(0xFF6600);
    graphics.fillTriangle(0, 0, 10, 5, 0, 10);
    graphics.generateTexture('thruster-flame', 10, 10);
    
    // Debris - now using the loaded SVG image
    // No need to generate a texture for debris anymore
    // The debris sprite will be used directly
    
    graphics.destroy();
  }

  private createStarfield() {
    // Create a simple starfield
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, this.sys.game.config.width as number);
      const y = Phaser.Math.Between(0, this.sys.game.config.height as number);
      const star = this.add.circle(x, y, 1, 0xFFFFFF, Phaser.Math.FloatBetween(0.3, 1));
      star.setDepth(-1);
    }
  }

  private createRescueTargets() {
    let positions: { x: number; y: number }[] = [];
    
    if (this.level === 1) {
      // Level 1: 8 astronauts, no debris
      positions = [
        { x: 121, y: 480 },
        { x: 750, y: 150 },
        { x: 530, y: 310 },
        { x: 120, y: 150 },
        { x: 615, y: 520 },
        { x: 250, y: 225 },
        { x: 555, y: 80 },
        { x: 390, y: 410 }
      ];
    } else if (this.level === 2) {
      // Level 2: Further astronauts, with debris
      positions = [
        { x: 150, y: 100 },
        { x: 650, y: 150 },
        { x: 200, y: 450 },
        { x: 550, y: 400 },
        { x: 350, y: 100 }
      ];
      this.createDebris();
    } else if (this.level === 3) {
      // Level 3: Gravity wells with strategically placed astronauts
      this.createGravityWells();
      positions = [
        { x: 200, y: 200 }, // Near first gravity well
        { x: 600, y: 400 }, // Near second gravity well
        { x: 100, y: 500 }, // Requiring orbital mechanics
        { x: 700, y: 100 }, // Requiring slingshot
        { x: 300, y: 500 }, // Between gravity wells
        { x: 500, y: 150 }  // Strategic position
      ];
      // Add some debris for extra challenge
      this.createDebris();
    }
    
    positions.forEach(pos => {
      const target = new RescueTarget(this, pos.x, pos.y, 'astronaut-sprite');
      this.rescueTargets.push(target);
    });
  }

  private gravityMessageCooldown = 0;
  
  private checkGravityInteractions() {
    const playerPos = this.player.getPosition();
    const currentTime = this.time.now;
    
    // Check if player is in any gravity field
    for (const gravityWell of this.gravityWells) {
      if (gravityWell.isInGravityField(playerPos.x, playerPos.y)) {
        const strength = gravityWell.getGravityStrength(playerPos.x, playerPos.y);
        
        // Show messages based on gravity strength and cooldown
        if (currentTime - this.gravityMessageCooldown > 8000) { // 8 second cooldown
          this.gravityMessageCooldown = currentTime;
          
          if (strength > 0.7) {
            this.educationalOverlay.show(
              "Strong Gravity Field",
              "You're in a strong gravitational field! Feel the pull? This demonstrates action at a distance.",
              true
            );
          } else if (strength > 0.3) {
            const playerVel = this.player.getVelocity();
            const speed = Math.sqrt(playerVel.x * playerVel.x + playerVel.y * playerVel.y);
            
            if (speed > 30) {
              this.educationalOverlay.show(
                "Orbital Mechanics",
                "Moving fast enough? You might achieve orbit! Balance speed and gravity for efficient travel.",
                true
              );
            } else {
              this.educationalOverlay.show(
                "Gravitational Influence",
                "Notice how your path curves? Gravity is changing your motion without you firing thrusters!",
                true
              );
            }
          }
        }
        break; // Only show message for first gravity well encountered
      }
    }
  }

  private updateTrajectoryHelper(time: number) {
    // Only update trajectory every 500ms to avoid performance issues
    if (time - this.lastTrajectoryTime < 500) return;
    this.lastTrajectoryTime = time;
    
    const playerVel = this.player.getVelocity();
    const playerPos = this.player.getPosition();
    const speed = Math.sqrt(playerVel.x * playerVel.x + playerVel.y * playerVel.y);
    
    // Only show trajectory if player has meaningful velocity
    if (speed > 10 && this.gravityWells.length > 0) {
      this.trajectoryHelper.setGravityWells(this.gravityWells);
      this.trajectoryHelper.showTrajectory(
        playerPos.x, 
        playerPos.y, 
        playerVel.x, 
        playerVel.y, 
        40 // 40 steps for prediction
      );
    }
  }

  private createGravityWells() {
    // Create two gravity wells for Level 3
    const gravityWell1 = new GravityWell(this, 200, 300, 80, 35, 150);
    const gravityWell2 = new GravityWell(this, 600, 200, 60, 30, 120);
    
    this.gravityWells.push(gravityWell1, gravityWell2);
    
    // Add gravity wells to physics engine
    this.physicsEngine.addGravityWell(gravityWell1);
    this.physicsEngine.addGravityWell(gravityWell2);
  }

  private createDebris() {
    // Create moving debris for Level 2
    for (let i = 0; i < 4; i++) {
      const x = Phaser.Math.Between(100, 700);
      const y = Phaser.Math.Between(100, 500);
      const debrisObj = new Debris(this, x, y);
      this.debris.push(debrisObj);
    }
  }

  private createRescueStation() {
    // Create a visual marker for the rescue station at the center of the screen
    const stationX = 400;
    const stationY = 300;
    
    // Create a container for the station elements
    this.rescueStation = this.add.container(stationX, stationY);
    
    // Create the outer circle (docking area)
    const outerCircle = this.add.circle(0, 0, 80, 0x3366ff, 0.2);
    
    // Create the inner circle (station core)
    const innerCircle = this.add.circle(0, 0, 40, 0x3366ff, 0.4);
    
    // Create pulsing effect for better visibility
    const pulseCircle = this.add.circle(0, 0, 60, 0xffffff, 0.1);
    
    // Add text label
    const label = this.add.text(0, -95, 'RESCUE STATION', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#3366ff'
    }).setOrigin(0.5);
    
    // Add all elements to the container
    this.rescueStation.add([outerCircle, innerCircle, pulseCircle, label]);
    
    // Create a pulsing animation
    this.tweens.add({
      targets: pulseCircle,
      alpha: 0.3,
      scale: 1.2,
      duration: 1500,
      yoyo: true,
      repeat: -1
    });
    
    // Set depth to be behind player but above background
    this.rescueStation.setDepth(-0.5);
  }

  private setupInput() {
    // Keyboard input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D');
    this.rescueKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private handleInput() {
    // Reset mobile controls
    Object.keys(this.mobileControls).forEach(key => {
      if (key !== 'rescue') {
        (this.mobileControls as any)[key] = false;
      }
    });
    
    // Keyboard input
    if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      this.mobileControls.up = true;
    }
    if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      this.mobileControls.down = true;
    }
    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      this.mobileControls.left = true;
    }
    if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      this.mobileControls.right = true;
    }
    
    // Rescue action
    if (Phaser.Input.Keyboard.JustDown(this.rescueKey) || this.mobileControls.rescue) {
      this.attemptRescue();
      this.mobileControls.rescue = false; // Reset mobile rescue control
    }
  }

  private attemptRescue() {
    const playerPos = this.player.getPosition();
    const rescueRange = 60;
    
    // Check if we can rescue new astronauts
    for (let i = this.rescueTargets.length - 1; i >= 0; i--) {
      const target = this.rescueTargets[i];
      if (!target.isRescued()) {
        const distance = Phaser.Math.Distance.Between(
          playerPos.x, playerPos.y,
          target.x, target.y
        );
        
        if (distance < rescueRange) {
          target.rescue();
          this.score += 100;
          this.rescueTargets.splice(i, 1);
          
          // Add to towed astronauts
          this.towedAstronauts.push(target);
          
          // Increase player mass
          this.player.increaseMass(2);
          
    // Show educational message about mass
          this.educationalOverlay.show(
            "Newton's 2nd Law",
            `Towing astronaut ${this.towedAstronauts.length}: Increased mass reduces acceleration (F = ma)!`,
            true // Auto-hide after 3 seconds
          );
          
          // Show gravity interaction message in Level 3
          if (this.level === 3 && this.gravityWells.length > 0) {
            this.time.delayedCall(3500, () => {
              this.educationalOverlay.show(
                "Gravity + Mass Effect",
                "Extra mass also affects how gravity pulls you! Heavier objects fall faster?",
                true
              );
            });
          }
          break; // Only rescue one at a time
        }
      }
    }
    
    // Check if we can deliver astronauts to rescue station (simplified: screen center)
    const stationRange = 80;
    const stationPos = { x: 400, y: 300 };
    const distanceToStation = Phaser.Math.Distance.Between(
      playerPos.x, playerPos.y,
      stationPos.x, stationPos.y
    );
    
    if (distanceToStation < stationRange && this.towedAstronauts.length > 0) {
      // Deliver all towed astronauts
      const delivered = this.towedAstronauts.length;
      this.totalAstronautsRescued += delivered;
      this.score += delivered * 50; // Bonus for delivery
      
      // Reset towed astronauts and player mass
      this.towedAstronauts.forEach(astronaut => astronaut.destroy());
      this.towedAstronauts = [];
      this.player.resetMass();
      
      this.educationalOverlay.show(
        "Astronauts Delivered!",
        `${delivered} astronauts safely delivered! Mass reduced, acceleration restored.`,
        true // Auto-hide after 3 seconds
      );
      
      // Show gravity-specific message in Level 3
      if (this.level === 3) {
        this.time.delayedCall(3500, () => {
          this.educationalOverlay.show(
            "Gravity Well Mastery",
            "Use gravity to your advantage! Slingshot around wells to save fuel and reach distant targets.",
            true
          );
        });
      }
    }
  }

  private startGameTimer() {
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeRemaining--;
        if (this.timeRemaining <= 0) {
          this.gameOver();
        }
      },
      loop: true
    });
  }

  private checkGameState() {
    // Win condition: all astronauts rescued and delivered
    if (this.rescueTargets.length === 0 && this.towedAstronauts.length === 0) {
      console.log(`Level ${this.level} complete! Rescued targets: ${this.rescueTargets.length}, Towed: ${this.towedAstronauts.length}`);
      
      // Add a small delay before showing level completion to ensure any existing overlays are closed
      this.time.delayedCall(500, () => {
        if (this.level === 1) {
          this.advanceToLevel2();
        } else if (this.level === 2) {
          this.advanceToLevel3();
        } else {
          this.gameWin();
        }
      });
    }
    
    // Lose condition: time up
    if (this.timeRemaining <= 0) {
      this.gameOver();
    }
  }

  // Track last collision time to prevent multiple overlays
  private lastCollisionTime = 0;
  private collisionCooldown = 1000; // 1 second cooldown between collision messages
  
  private checkCollisions() {
    const playerPos = this.player.getPosition();
    const playerVel = this.player.getVelocity();
    const collisionRange = 35;
    const currentTime = this.time.now;
    let collisionOccurred = false;
    
    // Check player vs debris collisions
    for (let i = 0; i < this.debris.length; i++) {
      const debris = this.debris[i];
      const distance = Phaser.Math.Distance.Between(
        playerPos.x, playerPos.y,
        debris.x, debris.y
      );
      
      if (distance < collisionRange) {
        // Handle collision - transfer momentum
        const newVel = debris.handleCollision(playerVel, this.player.getMass());
        this.player.setVelocity(newVel.x, newVel.y);
        
        // Only show overlay if enough time has passed since last collision
        if (currentTime - this.lastCollisionTime > this.collisionCooldown) {
          this.lastCollisionTime = currentTime;
          
          // Show educational message
          if (this.educationalOverlay.isOverlayVisible()) {
            this.educationalOverlay.hide();
          }
          
          this.time.delayedCall(100, () => {
            this.educationalOverlay.show(
              "Newton's 3rd Law",
              "Collision! Momentum transferred between objects - equal and opposite reaction!",
              true // Auto-hide after 3 seconds
            );
          });
        }
        
        // Break after handling one collision to prevent multiple in same frame
        collisionOccurred = true;
        break;
      }
    }
    
    // Only check astronaut collisions if no player collision occurred
    if (!collisionOccurred) {
      // Check towed astronauts vs debris collisions
      this.towedAstronauts.forEach(astronaut => {
        this.debris.forEach(debris => {
          const distance = Phaser.Math.Distance.Between(
            astronaut.x, astronaut.y,
            debris.x, debris.y
          );
          
          if (distance < 30) {
            // Astronaut gets knocked away - use smoother movement
            const knockDirection = Phaser.Math.Angle.Between(debris.x, debris.y, astronaut.x, astronaut.y);
            const knockForce = 20;
            
            // Use tweens for smoother movement
            this.tweens.add({
              targets: astronaut,
              x: astronaut.x + Math.cos(knockDirection) * knockForce,
              y: astronaut.y + Math.sin(knockDirection) * knockForce,
              duration: 200,
              ease: 'Power2'
            });
          }
        });
      });
    }
  }

  private advanceToLevel2() {
    if (!this.gameStarted) return;
    this.gameStarted = false;
    
    // Force hide any existing overlays first
    if (this.educationalOverlay.isOverlayVisible()) {
      this.educationalOverlay.hide();
    }
    
    // Create a custom overlay for level transition that doesn't use the standard space key handler
    this.createLevelTransitionOverlay();
  }
  
  private createLevelTransitionOverlay() {
    const gameWidth = this.sys.game.config.width as number;
    const gameHeight = this.sys.game.config.height as number;
    
    // Create container
    const overlay = this.add.container(gameWidth / 2, gameHeight / 2);
    overlay.setDepth(200);
    
    // Semi-transparent background
    const background = this.add.graphics();
    background.fillStyle(0x0B1426, 0.9);
    background.fillRoundedRect(-200, -100, 400, 200, 16);
    background.lineStyle(3, 0x00E5FF);
    background.strokeRoundedRect(-200, -100, 400, 200, 16);
    
    // Title text
    const titleText = this.add.text(0, -60, "Level 1 Complete!", {
      fontSize: '24px',
      fontFamily: 'Orbitron, monospace',
      color: '#00E5FF',
      align: 'center'
    });
    titleText.setOrigin(0.5);
    
    // Description text
    const descriptionText = this.add.text(0, -10, 
      "Great! Now try Level 2 with moving debris and multiple astronauts. Press SPACE to continue.", {
      fontSize: '16px',
      fontFamily: 'Orbitron, monospace',
      color: '#FFFFFF',
      align: 'center',
      wordWrap: { width: 360, useAdvancedWrap: true }
    });
    descriptionText.setOrigin(0.5);
    
    // Close button
    const closeButton = this.add.text(0, 60, 'PRESS SPACE TO CONTINUE', {
      fontSize: '14px',
      fontFamily: 'Orbitron, monospace',
      color: '#FF6600',
      align: 'center'
    });
    closeButton.setOrigin(0.5);
    closeButton.setInteractive({ useHandCursor: true });
    
    // Add pulsing effect to close button
    this.tweens.add({
      targets: closeButton,
      alpha: { from: 0.7, to: 1 },
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    // Add all elements to container
    overlay.add([background, titleText, descriptionText, closeButton]);
    
    // Entrance animation
    overlay.setScale(0);
    overlay.setAlpha(0);
    
    this.tweens.add({
      targets: overlay,
      scale: { from: 0, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    // Setup direct space key handler for level transition
    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    const advanceLevel = () => {
      // Remove all listeners
      if (spaceKey) spaceKey.off('down', advanceLevel);
      closeButton.off('pointerdown', advanceLevel);
      this.input.off('pointerdown', advanceLevel);
      
      // Exit animation
      this.tweens.add({
        targets: overlay,
        scale: { from: 1, to: 0 },
        alpha: { from: 1, to: 0 },
        duration: 200,
        ease: 'Back.easeIn',
        onComplete: () => {
          overlay.destroy();
          
          // Setup level 2
          this.level = 2;
          this.timeRemaining = 180; // 3 minutes for level 2
          this.fuel = 100; // Refuel
          this.debris = []; // Clear any existing debris
          this.rescueTargets = []; // Clear existing targets
          this.towedAstronauts = [];
          this.player.resetMass();
          this.createRescueTargets(); // Create new targets with debris
          this.gameStarted = true;
        }
      });
    };
    
    // Add multiple ways to advance to level 2
    if (spaceKey) spaceKey.on('down', advanceLevel);
    closeButton.on('pointerdown', advanceLevel);
    this.input.once('pointerdown', advanceLevel);
  }

  private advanceToLevel3() {
    if (!this.gameStarted) return;
    this.gameStarted = false;
    
    // Force hide any existing overlays first
    if (this.educationalOverlay.isOverlayVisible()) {
      this.educationalOverlay.hide();
    }
    
    // Create a custom overlay for level 3 transition
    this.createLevel3TransitionOverlay();
  }
  
  private createLevel3TransitionOverlay() {
    const gameWidth = this.sys.game.config.width as number;
    const gameHeight = this.sys.game.config.height as number;
    
    // Create container
    const overlay = this.add.container(gameWidth / 2, gameHeight / 2);
    overlay.setDepth(200);
    
    // Semi-transparent background
    const background = this.add.graphics();
    background.fillStyle(0x0B1426, 0.9);
    background.fillRoundedRect(-250, -120, 500, 240, 16);
    background.lineStyle(3, 0x00E5FF);
    background.strokeRoundedRect(-250, -120, 500, 240, 16);
    
    // Title text
    const titleText = this.add.text(0, -80, "Level 2 Complete!", {
      fontSize: '24px',
      fontFamily: 'Orbitron, monospace',
      color: '#00E5FF',
      align: 'center'
    });
    titleText.setOrigin(0.5);
    
    // Description text
    const descriptionText = this.add.text(0, -20, 
      "Excellent! Now try Level 3 with GRAVITY WELLS!\nUse gravitational forces to slingshot and reach distant astronauts.\nWatch for curved paths and orbital mechanics!", {
      fontSize: '16px',
      fontFamily: 'Orbitron, monospace',
      color: '#FFFFFF',
      align: 'center',
      wordWrap: { width: 450, useAdvancedWrap: true }
    });
    descriptionText.setOrigin(0.5);
    
    // Close button
    const closeButton = this.add.text(0, 80, 'PRESS SPACE TO START LEVEL 3', {
      fontSize: '14px',
      fontFamily: 'Orbitron, monospace',
      color: '#FF6600',
      align: 'center'
    });
    closeButton.setOrigin(0.5);
    closeButton.setInteractive({ useHandCursor: true });
    
    // Add pulsing effect to close button
    this.tweens.add({
      targets: closeButton,
      alpha: { from: 0.7, to: 1 },
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    // Add all elements to container
    overlay.add([background, titleText, descriptionText, closeButton]);
    
    // Entrance animation
    overlay.setScale(0);
    overlay.setAlpha(0);
    
    this.tweens.add({
      targets: overlay,
      scale: { from: 0, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    // Setup direct space key handler for level transition
    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    const advanceLevel = () => {
      // Remove all listeners
      if (spaceKey) spaceKey.off('down', advanceLevel);
      closeButton.off('pointerdown', advanceLevel);
      this.input.off('pointerdown', advanceLevel);
      
      // Exit animation
      this.tweens.add({
        targets: overlay,
        scale: { from: 1, to: 0 },
        alpha: { from: 1, to: 0 },
        duration: 200,
        ease: 'Back.easeIn',
        onComplete: () => {
          overlay.destroy();
          
          // Setup level 3
          this.level = 3;
          this.timeRemaining = 240; // 4 minutes for level 3 (gravity adds complexity)
          this.fuel = 100; // Refuel
          this.debris = []; // Clear any existing debris
          this.rescueTargets = []; // Clear existing targets
          this.towedAstronauts = [];
          this.gravityWells = []; // Clear existing gravity wells
          this.player.resetMass();
          
          // Clear any existing gravity wells from physics engine
          this.physicsEngine.getGravityWells().forEach(well => {
            this.physicsEngine.removeGravityWell(well);
          });
          
          this.createRescueTargets(); // Create new targets with gravity wells
          this.gameStarted = true;
          
          // Show initial Level 3 guidance after a short delay
          this.time.delayedCall(1000, () => {
            this.educationalOverlay.show(
              "Level 3: Gravitational Forces",
              "Welcome to space with gravity! Blue circles show gravity wells. Watch how they bend your path and use them for slingshot maneuvers!",
              true
            );
          });
        }
      });
    };
    
    // Add multiple ways to advance to level 3
    if (spaceKey) spaceKey.on('down', advanceLevel);
    closeButton.on('pointerdown', advanceLevel);
    this.input.once('pointerdown', advanceLevel);
  }

  private gameWin() {
    if (!this.gameStarted) return; // Prevent double trigger
    this.gameStarted = false;
    
    console.log('Game won! Showing overlay...');
    
    // Force hide any existing overlays first
    if (this.educationalOverlay.isOverlayVisible()) {
      this.educationalOverlay.hide();
    }
    
    // Add a small delay before showing the win message
    this.time.delayedCall(200, () => {
      // Show overlay first, then pause
      this.educationalOverlay.show(
        "Mission Complete!",
        `Outstanding! You've mastered all THREE of Newton's Laws of Motion across 3 challenging levels! Final Score: ${this.score}`
      );
      
      // Pause after a short delay to ensure overlay is shown
      this.time.delayedCall(100, () => {
        this.scene.pause();
      });
    });
  }

  private gameOver() {
    if (!this.gameStarted) return; // Prevent double trigger  
    this.gameStarted = false;
    
    // Force hide any existing overlays first
    if (this.educationalOverlay.isOverlayVisible()) {
      this.educationalOverlay.hide();
    }
    
    // Add a small delay before showing the game over message
    this.time.delayedCall(200, () => {
      this.scene.pause();
      this.educationalOverlay.show(
        "Mission Failed",
        "Time's up! Try again and remember to use Newton's Laws to move efficiently through space."
      );
    });
  }

  // Public methods for UI interaction
  public consumeFuel(amount: number) {
    this.fuel = Math.max(0, this.fuel - amount);
  }

  public getFuel(): number {
    return this.fuel;
  }

  public getScore(): number {
    return this.score;
  }

  public setMobileControl(control: string, active: boolean) {
    (this.mobileControls as any)[control] = active;
  }
}
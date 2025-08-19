import * as Phaser from 'phaser';
import { PlayerPod } from './PlayerPod';
import { RescueTarget } from './RescueTarget';
import { Debris } from './Debris';
import { PhysicsEngine } from './PhysicsEngine';
import { GameHUD } from './GameHUD';
import { EducationalOverlay } from './EducationalOverlay';

export class GameScene extends Phaser.Scene {
  private player!: PlayerPod;
  private rescueTargets: RescueTarget[] = [];
  private debris: Debris[] = [];
  private towedAstronauts: RescueTarget[] = [];
  private physicsEngine!: PhysicsEngine;
  private gameHUD!: GameHUD;
  private educationalOverlay!: EducationalOverlay;
  
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
    // Create simple colored rectangles for sprites (will be replaced with actual sprites later)
    this.load.image('starfield', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    
    // Create simple colored shapes for game objects
    this.createSimpleSprites();
  }

  create() {
    // Initialize physics engine
    this.physicsEngine = new PhysicsEngine(this);
    
    // Create starfield background
    this.createStarfield();
    
    // Create player
    this.player = new PlayerPod(this, 400, 300);
    
    // Create rescue targets
    this.createRescueTargets();
    
    // Setup input
    this.setupInput();
    
    // Create HUD
    this.gameHUD = new GameHUD(this);
    
    // Create educational overlay
    this.educationalOverlay = new EducationalOverlay(this);
    
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
  }

  private createSimpleSprites() {
    // Create colored rectangles for game sprites
    const graphics = this.add.graphics();
    
    // Player pod (cyan rectangle)
    graphics.fillStyle(0x00FFFF);
    graphics.fillRect(0, 0, 40, 40);
    graphics.generateTexture('player-pod', 40, 40);
    
    // Astronaut (green circle)
    graphics.clear();
    graphics.fillStyle(0x00FF88);
    graphics.fillCircle(15, 15, 15);
    graphics.generateTexture('astronaut', 30, 30);
    
    // Thruster flame (orange)
    graphics.clear();
    graphics.fillStyle(0xFF6600);
    graphics.fillTriangle(0, 0, 10, 5, 0, 10);
    graphics.generateTexture('thruster-flame', 10, 10);
    
    // Debris (gray irregular shape)
    graphics.clear();
    graphics.fillStyle(0x666666);
    graphics.fillRect(0, 0, 25, 25);
    graphics.fillRect(5, -5, 15, 15);
    graphics.fillRect(-3, 8, 20, 12);
    graphics.generateTexture('debris', 30, 30);
    
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
        { x: 200, y: 150 },
        { x: 600, y: 200 },
        { x: 500, y: 400 },
        { x: 150, y: 300 },
        { x: 650, y: 350 },
        { x: 300, y: 100 },
        { x: 550, y: 150 },
        { x: 400, y: 500 }
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
    }
    
    positions.forEach(pos => {
      const target = new RescueTarget(this, pos.x, pos.y, 'astronaut');
      this.rescueTargets.push(target);
    });
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
          this.player.increaseMass(0.5);
          
          // Show educational message about mass
          this.educationalOverlay.show(
            "Newton's 2nd Law",
            `Towing astronaut ${this.towedAstronauts.length}: Increased mass reduces acceleration (F = ma)!`
          );
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
        `${delivered} astronauts safely delivered! Mass reduced, acceleration restored.`
      );
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
      if (this.level === 1) {
        this.advanceToLevel2();
      } else {
        this.gameWin();
      }
    }
    
    // Lose condition: time up
    if (this.timeRemaining <= 0) {
      this.gameOver();
    }
  }

  private checkCollisions() {
    const playerPos = this.player.getPosition();
    const playerVel = this.player.getVelocity();
    const collisionRange = 35;
    
    // Check player vs debris collisions
    this.debris.forEach(debris => {
      const distance = Phaser.Math.Distance.Between(
        playerPos.x, playerPos.y,
        debris.x, debris.y
      );
      
      if (distance < collisionRange) {
        // Handle collision - transfer momentum
        const newVel = debris.handleCollision(playerVel, this.player.getMass());
        this.player.setVelocity(newVel.x, newVel.y);
        
        // Show educational message
        this.educationalOverlay.show(
          "Newton's 3rd Law",
          "Collision! Momentum transferred between objects - equal and opposite reaction!"
        );
        
        // Consume fuel due to collision
        this.consumeFuel(5);
      }
    });
    
    // Check towed astronauts vs debris collisions
    this.towedAstronauts.forEach(astronaut => {
      this.debris.forEach(debris => {
        const distance = Phaser.Math.Distance.Between(
          astronaut.x, astronaut.y,
          debris.x, debris.y
        );
        
        if (distance < 30) {
          // Astronaut gets knocked away
          const knockDirection = Phaser.Math.Angle.Between(debris.x, debris.y, astronaut.x, astronaut.y);
          const knockForce = 20;
          astronaut.x += Math.cos(knockDirection) * knockForce;
          astronaut.y += Math.sin(knockDirection) * knockForce;
        }
      });
    });
  }

  private advanceToLevel2() {
    if (!this.gameStarted) return;
    this.gameStarted = false;
    
    this.educationalOverlay.show(
      "Level 1 Complete!",
      "Great! Now try Level 2 with moving debris and multiple astronauts. Press SPACE to continue."
    );
    
    // Advance to level 2 after delay
    this.time.delayedCall(3000, () => {
      this.level = 2;
      this.timeRemaining = 180; // 3 minutes for level 2
      this.fuel = 100; // Refuel
      this.debris = []; // Clear any existing debris
      this.rescueTargets = []; // Clear existing targets
      this.towedAstronauts = [];
      this.player.resetMass();
      this.createRescueTargets(); // Create new targets with debris
      this.gameStarted = true;
    });
  }

  private gameWin() {
    if (!this.gameStarted) return; // Prevent double trigger
    this.gameStarted = false;
    
    console.log('Game won! Showing overlay...');
    
    // Show overlay first, then pause
    this.educationalOverlay.show(
      "Mission Complete!",
      `Great job! You've demonstrated all three of Newton's Laws of Motion. Score: ${this.score}`
    );
    
    // Pause after a short delay to ensure overlay is shown
    this.time.delayedCall(100, () => {
      this.scene.pause();
    });
  }

  private gameOver() {
    if (!this.gameStarted) return; // Prevent double trigger  
    this.gameStarted = false;
    this.scene.pause();
    this.educationalOverlay.show(
      "Mission Failed",
      "Time's up! Try again and remember to use Newton's Laws to move efficiently through space."
    );
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
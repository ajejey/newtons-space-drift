import * as Phaser from 'phaser';
import { GravityWell } from './GravityWell';

export class TrajectoryHelper extends Phaser.GameObjects.Graphics {
  private gravityWells: GravityWell[] = [];
  private isVisible: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.setDepth(8);
  }

  public setGravityWells(gravityWells: GravityWell[]) {
    this.gravityWells = gravityWells;
  }

  public showTrajectory(startX: number, startY: number, velocityX: number, velocityY: number, steps: number = 30) {
    this.clear();
    this.isVisible = true;

    // Simulate trajectory points
    const trajectoryPoints = this.simulateTrajectory(startX, startY, velocityX, velocityY, steps);
    
    if (trajectoryPoints.length < 2) return;

    // Draw the predicted trajectory
    this.lineStyle(2, 0xFFFF00, 0.7);
    this.beginPath();
    this.moveTo(trajectoryPoints[0].x, trajectoryPoints[0].y);

    for (let i = 1; i < trajectoryPoints.length; i++) {
      const alpha = 1 - (i / trajectoryPoints.length); // Fade trajectory over distance
      this.lineStyle(2, 0xFFFF00, alpha * 0.7);
      this.lineTo(trajectoryPoints[i].x, trajectoryPoints[i].y);
    }

    this.strokePath();

    // Draw direction arrows along the trajectory
    this.drawDirectionArrows(trajectoryPoints);

    // Auto-hide after a few seconds
    this.scene.time.delayedCall(3000, () => {
      this.hideTrajectory();
    });
  }

  public hideTrajectory() {
    this.clear();
    this.isVisible = false;
  }

  private simulateTrajectory(startX: number, startY: number, velocityX: number, velocityY: number, steps: number): {x: number, y: number, vx: number, vy: number}[] {
    const points: {x: number, y: number, vx: number, vy: number}[] = [];
    const deltaTime = 0.1; // Simulation time step
    const mass = 1; // Assume unit mass for simulation

    let x = startX;
    let y = startY;
    let vx = velocityX;
    let vy = velocityY;

    for (let i = 0; i < steps; i++) {
      points.push({ x, y, vx, vy });

      // Calculate gravitational forces from all gravity wells
      let totalForceX = 0;
      let totalForceY = 0;

      this.gravityWells.forEach(gravityWell => {
        const force = gravityWell.calculateGravitationalForce(x, y, mass);
        totalForceX += force.x;
        totalForceY += force.y;
      });

      // Apply gravitational acceleration (F = ma, so a = F/m)
      const accelerationX = totalForceX / mass;
      const accelerationY = totalForceY / mass;

      // Update velocity
      vx += accelerationX * deltaTime;
      vy += accelerationY * deltaTime;

      // Update position
      x += vx * deltaTime;
      y += vy * deltaTime;

      // Stop simulation if trajectory goes off screen
      if (x < -100 || x > 900 || y < -100 || y > 700) {
        break;
      }

      // Stop if we get too close to a gravity well (would crash)
      let tooClose = false;
      this.gravityWells.forEach(gravityWell => {
        const distance = Math.sqrt((x - gravityWell.x) ** 2 + (y - gravityWell.y) ** 2);
        if (distance < gravityWell.getRadius()) {
          tooClose = true;
        }
      });
      if (tooClose) break;
    }

    return points;
  }

  private drawDirectionArrows(trajectoryPoints: {x: number, y: number, vx: number, vy: number}[]) {
    // Draw arrows at regular intervals to show direction
    for (let i = 0; i < trajectoryPoints.length; i += 8) {
      const point = trajectoryPoints[i];
      const speed = Math.sqrt(point.vx ** 2 + point.vy ** 2);
      
      if (speed < 0.1) continue; // Skip if moving very slowly

      const arrowLength = 15;
      const arrowAngle = Math.atan2(point.vy, point.vx);
      
      // Arrow head
      const arrowHeadX = point.x + Math.cos(arrowAngle) * arrowLength;
      const arrowHeadY = point.y + Math.sin(arrowAngle) * arrowLength;
      
      // Arrow wing angles
      const wingAngle1 = arrowAngle + 2.5;
      const wingAngle2 = arrowAngle - 2.5;
      const wingLength = arrowLength * 0.6;
      
      const wing1X = arrowHeadX - Math.cos(wingAngle1) * wingLength;
      const wing1Y = arrowHeadY - Math.sin(wingAngle1) * wingLength;
      const wing2X = arrowHeadX - Math.cos(wingAngle2) * wingLength;
      const wing2Y = arrowHeadY - Math.sin(wingAngle2) * wingLength;

      // Draw arrow
      this.lineStyle(2, 0xFFFF00, 0.8);
      this.beginPath();
      this.moveTo(point.x, point.y);
      this.lineTo(arrowHeadX, arrowHeadY);
      this.moveTo(arrowHeadX, arrowHeadY);
      this.lineTo(wing1X, wing1Y);
      this.moveTo(arrowHeadX, arrowHeadY);
      this.lineTo(wing2X, wing2Y);
      this.strokePath();
    }
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }
}
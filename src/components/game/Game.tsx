import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { GameScene } from './GameScene';
import { MobileControls } from './MobileControls';
import { useIsMobile } from '@/hooks/use-mobile';

export const Game: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const gameSceneRef = useRef<GameScene | null>(null);
  const isMobile = useIsMobile();
  const [gameLoaded, setGameLoaded] = useState(false);

  useEffect(() => {
    if (!gameRef.current) return;

    // Phaser game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current,
      backgroundColor: '#0B1426',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: GameScene,
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
          gravity: { x: 0, y: 0 } // Zero gravity space environment
        }
      },
      input: {
        touch: true,
        mouse: true
      }
    };

    // Create Phaser game
    phaserGameRef.current = new Phaser.Game(config);

    // Get reference to game scene
    phaserGameRef.current.events.once('ready', () => {
      gameSceneRef.current = phaserGameRef.current?.scene.getScene('GameScene') as GameScene;
      setGameLoaded(true);
    });

    // Handle window resize
    const handleResize = () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.scale.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  // Mobile control handlers
  const handleControlStart = (control: string) => {
    if (gameSceneRef.current) {
      gameSceneRef.current.setMobileControl(control, true);
    }
  };

  const handleControlEnd = (control: string) => {
    if (gameSceneRef.current) {
      gameSceneRef.current.setMobileControl(control, false);
    }
  };

  const handleRescue = () => {
    if (gameSceneRef.current) {
      gameSceneRef.current.setMobileControl('rescue', true);
      // Reset after a short delay
      setTimeout(() => {
        if (gameSceneRef.current) {
          gameSceneRef.current.setMobileControl('rescue', false);
        }
      }, 100);
    }
  };

  return (
    <div className="game-container">
      <div ref={gameRef} className="game-canvas" />
      
      {/* Mobile Controls Overlay */}
      <MobileControls
        onControlStart={handleControlStart}
        onControlEnd={handleControlEnd}
        onRescue={handleRescue}
        visible={isMobile && gameLoaded}
      />

      {/* Desktop Instructions */}
      {/* {!isMobile && gameLoaded && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="hud-panel text-center max-w-md">
            <h3 className="text-lg font-bold text-primary mb-2">Newton's Space Rescue</h3>
            <p className="text-sm text-foreground mb-2">
              Use <span className="text-primary font-semibold">Arrow Keys</span> or <span className="text-primary font-semibold">WASD</span> to fire thrusters
            </p>
            <p className="text-sm text-foreground">
              Press <span className="text-primary font-semibold">SPACE</span> to rescue astronauts
            </p>
          </div>
        </div>
      )} */}

      {/* Game Title */}
      <div className="absolute top-4 left-4 z-40">
        <h1 className="text-2xl font-bold text-primary tracking-wide">
          NEWTON'S SPACE RESCUE
        </h1>
        <p className="text-sm text-muted-foreground">
          Learn Physics Through Gameplay
        </p>
        <p className="text-sm text-foreground mb-2">
              Use <span className="text-primary font-semibold">Arrow Keys</span> or <span className="text-primary font-semibold">WASD</span> to fire thrusters
            </p>
      </div>

      {/* Loading Overlay */}
      {!gameLoaded && (
        <div className="absolute inset-0 bg-background flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-pulse text-4xl text-primary mb-4">🚀</div>
            <h2 className="text-xl font-bold text-primary mb-2">Initializing Mission...</h2>
            <p className="text-muted-foreground">Preparing Newton's Laws demonstration</p>
          </div>
        </div>
      )}
    </div>
  );
};
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
  const [instructionsOpen, setInstructionsOpen] = useState(true);

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

      {/* Game Title and Instructions */}
      <div className="absolute top-4 left-4 z-40">
        <h1 className="text-2xl font-bold text-primary tracking-wide">
          NEWTON'S SPACE RESCUE
        </h1>
        <p className="text-sm text-muted-foreground mb-3">
          Learn Physics Through Gameplay
        </p>
        
        {/* Collapsible Game Instructions */}
        <div className="bg-black bg-opacity-50 p-3 rounded-md border border-primary border-opacity-30 max-w-xs">
          <button 
            onClick={() => setInstructionsOpen(!instructionsOpen)}
            className="flex items-center justify-between w-full text-md font-bold text-primary mb-2"
          >
            <span>MISSION INSTRUCTIONS:</span>
            <span>{instructionsOpen ? '▲' : '▼'}</span>
          </button>
          
          {instructionsOpen && (
            <ol className="list-decimal list-inside text-sm space-y-2 text-foreground">
              <li>Use <span className="text-primary font-semibold">Arrow Keys</span> or <span className="text-primary font-semibold">WASD</span> to fire thrusters</li>
              <li>Approach green astronauts and press <span className="text-primary font-semibold">SPACE</span> to rescue them</li>
              <li>Deliver rescued astronauts to the <span className="text-primary font-semibold">blue rescue station</span> at the center</li>
              <li>Avoid collisions with debris - they consume extra fuel</li>
              <li>Complete the mission before time runs out</li>
              <li>When fuel reaches 0%, thrusters will stop working</li>
            </ol>
          )}
        </div>
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
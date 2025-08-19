import React from 'react';
import { Button } from '@/components/ui/button';

interface MobileControlsProps {
  onControlStart: (control: string) => void;
  onControlEnd: (control: string) => void;
  onRescue: () => void;
  visible: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onControlStart,
  onControlEnd,
  onRescue,
  visible
}) => {
  if (!visible) return null;

  const handleTouchStart = (control: string) => {
    return (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      onControlStart(control);
    };
  };

  const handleTouchEnd = (control: string) => {
    return (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      onControlEnd(control);
    };
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Directional Controls - Left Side */}
      <div className="absolute left-4 bottom-4 pointer-events-auto">
        <div className="relative w-32 h-32">
          {/* Up Button */}
          <Button
            className="control-button absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-12 p-0"
            onTouchStart={handleTouchStart('up')}
            onTouchEnd={handleTouchEnd('up')}
            onMouseDown={handleTouchStart('up')}
            onMouseUp={handleTouchEnd('up')}
            onMouseLeave={handleTouchEnd('up')}
          >
            ↑
          </Button>
          
          {/* Down Button */}
          <Button
            className="control-button absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-12 p-0"
            onTouchStart={handleTouchStart('down')}
            onTouchEnd={handleTouchEnd('down')}
            onMouseDown={handleTouchStart('down')}
            onMouseUp={handleTouchEnd('down')}
            onMouseLeave={handleTouchEnd('down')}
          >
            ↓
          </Button>
          
          {/* Left Button */}
          <Button
            className="control-button absolute left-0 top-1/2 transform -translate-y-1/2 w-12 h-12 p-0"
            onTouchStart={handleTouchStart('left')}
            onTouchEnd={handleTouchEnd('left')}
            onMouseDown={handleTouchStart('left')}
            onMouseUp={handleTouchEnd('left')}
            onMouseLeave={handleTouchEnd('left')}
          >
            ←
          </Button>
          
          {/* Right Button */}
          <Button
            className="control-button absolute right-0 top-1/2 transform -translate-y-1/2 w-12 h-12 p-0"
            onTouchStart={handleTouchStart('right')}
            onTouchEnd={handleTouchEnd('right')}
            onMouseDown={handleTouchStart('right')}
            onMouseUp={handleTouchEnd('right')}
            onMouseLeave={handleTouchEnd('right')}
          >
            →
          </Button>
        </div>
      </div>

      {/* Rescue Button - Right Side */}
      <div className="absolute right-4 bottom-4 pointer-events-auto">
        <Button
          className="control-button w-16 h-16 text-sm font-bold"
          onTouchStart={onRescue}
          onMouseDown={onRescue}
        >
          RESCUE
        </Button>
      </div>

      {/* Touch Areas for Physics Demonstration */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="hud-panel text-center max-w-xs">
          <p className="text-xs text-muted-foreground">
            Use thrusters to move through space!
          </p>
          <p className="text-xs text-primary mt-1">
            Experience Newton's Laws in action
          </p>
        </div>
      </div>
    </div>
  );
};
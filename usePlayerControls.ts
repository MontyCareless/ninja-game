import { useState, useEffect, useCallback } from 'react';
import { Vector2D, Controls } from '../types';

export const usePlayerControls = (): Controls => {
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [mousePosition, setMousePosition] = useState<Vector2D>({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isRightMouseDown, setIsRightMouseDown] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setKeys(prevKeys => new Set(prevKeys).add(e.key.toLowerCase()));
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setKeys(prevKeys => {
      const newKeys = new Set(prevKeys);
      newKeys.delete(e.key.toLowerCase());
      return newKeys;
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 0) {
      setIsMouseDown(true);
    } else if (e.button === 2) {
      setIsRightMouseDown(true);
    }
  }, []);
  
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (e.button === 0) {
      setIsMouseDown(false);
    } else if (e.button === 2) {
      setIsRightMouseDown(false);
    }
  }, []);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handleMouseDown, handleMouseUp, handleContextMenu]);

  return { keys, mouse: { position: mousePosition, isDown: isMouseDown, isRightDown: isRightMouseDown } };
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Theme } from '../Home'; // Assuming Home exports Theme type

interface TypingEffectProps {
  textToType: string;
  typingSpeed?: number;
  theme: Theme;
  onTypingComplete?: () => void;
}

const TypingEffect: React.FC<TypingEffectProps> = ({
  textToType,
  typingSpeed = 20, // ms per character
  theme,
  onTypingComplete,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const currentIndexRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef(0);

  useEffect(() => {
    // Reset when textToType changes or is empty
    setDisplayedText('');
    setIsTyping(true);
    currentIndexRef.current = 0;
    lastUpdateTimeRef.current = performance.now(); // Initialize with current time

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }

    if (textToType && textToType.length > 0) {
      const typeCharacter = (timestamp: number) => {
        if (!isTyping && currentIndexRef.current >= textToType.length) { // Ensure isTyping reflects completion
             if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
             return;
        }

        const deltaTime = timestamp - lastUpdateTimeRef.current;

        if (deltaTime >= typingSpeed) {
          if (currentIndexRef.current < textToType.length) {
            // Append characters based on how many intervals have passed
            // This helps catch up if the browser tab was inactive
            const charsToAdd = Math.floor(deltaTime / typingSpeed);
            const nextSliceEnd = Math.min(currentIndexRef.current + charsToAdd, textToType.length);
            
            setDisplayedText(textToType.substring(0, nextSliceEnd));
            currentIndexRef.current = nextSliceEnd;
            lastUpdateTimeRef.current = timestamp;

            if (currentIndexRef.current >= textToType.length) {
              setIsTyping(false);
              if (onTypingComplete) {
                onTypingComplete();
              }
              if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
              return; 
            }
          } else { // Should be caught by the previous block
            setIsTyping(false);
            if (onTypingComplete) {
              onTypingComplete();
            }
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            return; 
          }
        }
        animationFrameIdRef.current = requestAnimationFrame(typeCharacter);
      };
      // Initialize lastUpdateTimeRef before starting the animation loop
      lastUpdateTimeRef.current = performance.now();
      animationFrameIdRef.current = requestAnimationFrame(typeCharacter);
    } else {
        // Handle empty textToType immediately
        setIsTyping(false);
        setDisplayedText(''); // Ensure it's empty
        if (onTypingComplete) {
            onTypingComplete();
        }
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      // Set isTyping to false on unmount or prop change to ensure correct final class
      setIsTyping(false);
    };
  }, [textToType, typingSpeed, onTypingComplete]); // isTyping removed from deps

  const getFinalColorClass = () => {
    switch (theme) {
      case 'dark': return 'static-text-dark';
      case 'surprise': return 'static-text-surprise';
      case 'light':
      default: return 'static-text-light';
    }
  };
  
  // Use a key to force re-mount when textToType changes, ensuring animation restarts correctly
  // This is a simpler way to manage reset than complex useEffect logic if textToType changes rapidly
  // However, the current useEffect handles reset fairly well. Let's rely on that for now.

  return (
    <div className="relative">
      <pre
        className={`whitespace-pre-wrap font-sans text-sm transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          ${isTyping ? 'animate-gradient-text' : getFinalColorClass()}
        `}
        aria-live="polite" // "polite" is often better for typed text than "assertive"
        aria-busy={isTyping}
      >
        {displayedText}
        {isTyping && <span className="animate-pulse-cursor" aria-hidden="true">|</span>}
      </pre>
      {isTyping && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping opacity-75"></div>
      )}
    </div>
  );
};

export default TypingEffect;

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for smooth animations in terminal UI
 * @param {boolean} isOpen - Whether the component should be open
 * @param {number} duration - Animation duration in milliseconds
 * @param {string} easing - Easing function type ('easeIn', 'easeOut', 'easeInOut', 'linear')
 * @returns {Object} Animation state and progress
 */
export const useAnimation = (isOpen, duration = 300, easing = 'easeOut') => {
    const [progress, setProgress] = useState(isOpen ? 1 : 0);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationRef = useRef(null);
    const startTimeRef = useRef(null);
    const startProgressRef = useRef(0);

    // Easing functions
    const easingFunctions = {
        linear: (t) => t,
        easeIn: (t) => t * t,
        easeOut: (t) => 1 - Math.pow(1 - t, 2),
        easeInOut: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    };

    const ease = easingFunctions[easing] || easingFunctions.easeOut;

    useEffect(() => {
        if (animationRef.current) {
            clearTimeout(animationRef.current);
        }

        const targetProgress = isOpen ? 1 : 0;
        const currentProgress = progress;

        // If we're already at the target, no need to animate
        if (Math.abs(currentProgress - targetProgress) < 0.01) {
            return;
        }

        setIsAnimating(true);
        startTimeRef.current = Date.now();
        startProgressRef.current = currentProgress;

        const animate = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const normalizedTime = Math.min(elapsed / duration, 1);
            const easedProgress = ease(normalizedTime);

            // Interpolate between start and target progress
            const newProgress = startProgressRef.current + (targetProgress - startProgressRef.current) * easedProgress;
            setProgress(newProgress);

            if (normalizedTime < 1) {
                animationRef.current = setTimeout(animate, 16); // ~60fps
            } else {
                setProgress(targetProgress);
                setIsAnimating(false);
            }
        };

        animate();

        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, [isOpen, duration, ease]);

    return {
        progress,
        isAnimating,
        isVisible: progress > 0,
    };
};

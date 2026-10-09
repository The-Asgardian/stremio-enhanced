// Copyright (C) 2017-2026 Smart code 203358507

import { useEffect, useRef } from 'react';
import { useGamepad } from '../GamepadContext';
import { focusWithGamepadIndicator, getDirectionalCandidate, getFocusableElements } from './spatialNavigation';

const getActiveScope = (fallback: HTMLDivElement | null): HTMLElement | null => {
    const gamepadModal = document.querySelector<HTMLElement>('[data-gamepad-modal]');
    if (gamepadModal) return gamepadModal;

    const modals = document.querySelectorAll<HTMLElement>('.modals-container');
    for (const modal of modals) {
        if (modal.children.length > 0) return modal;
    }

    const dropdown = fallback?.querySelector<HTMLElement>('[class*="dropdown"][class*="open"]');
    if (dropdown) return dropdown;

    return fallback;
};

const useContentGamepadNavigation = (
    sectionRef: React.RefObject<HTMLDivElement>,
    gamepadHandlerId: string
) => {
    const gamepad = useGamepad();
    const lastFocused = useRef<HTMLDivElement | null>(null);
    const wasInOverlay = useRef(false);

    useEffect(() => {
        const section = sectionRef.current;
        const handleGamepadNavigation = (
            direction: 'left' | 'right' | 'up' | 'down'
        ) => {
            const scope = getActiveScope(sectionRef.current);
            const inOverlay = scope !== sectionRef.current;

            if (inOverlay && !wasInOverlay.current) {
                const focused = sectionRef.current?.querySelector<HTMLDivElement>(':focus');
                if (focused) lastFocused.current = focused;
            }
            wasInOverlay.current = inOverlay;

            const elements = getFocusableElements(scope);
            if (elements.length === 0) return;

            const activeElement = scope?.querySelector<HTMLElement>(':focus') ?? null;
            const nextElement = getDirectionalCandidate(elements, activeElement, direction);
            if (nextElement) focusWithGamepadIndicator(nextElement, scope);
        };

        const onSelect = () => {
            const scope = getActiveScope(sectionRef.current);
            const inOverlay = scope !== sectionRef.current;

            if (inOverlay && !wasInOverlay.current) {
                const focused = sectionRef.current?.querySelector<HTMLDivElement>(':focus');
                if (focused) lastFocused.current = focused;
            }
            wasInOverlay.current = inOverlay;

            const elements = getFocusableElements(scope);
            if (elements.length === 0) {
                if (lastFocused.current) {
                    focusWithGamepadIndicator(lastFocused.current, sectionRef.current);
                    wasInOverlay.current = false;
                }
                return;
            }

            const activeElement = scope?.querySelector<HTMLElement>(':focus') ?? null;

            if (!activeElement) {
                focusWithGamepadIndicator(elements[0], scope);
                return;
            }
            const isSelect = Array.from(activeElement.classList).some((cls) => cls.startsWith('select-input'));
            if (!isSelect) {
                activeElement?.click();

                requestAnimationFrame(() => {
                    const stillInOverlay = getActiveScope(sectionRef.current) !== sectionRef.current;
                    if (!stillInOverlay && wasInOverlay.current && lastFocused.current) {
                        focusWithGamepadIndicator(lastFocused.current, sectionRef.current);
                        wasInOverlay.current = false;
                    }
                });
            }
        };

        gamepad?.on('analog', gamepadHandlerId, handleGamepadNavigation);
        gamepad?.on('buttonA', gamepadHandlerId, onSelect);

        const clearGamepadFocus = () => {
            section?.querySelectorAll('[data-gamepad-focused="true"]').forEach((element) => {
                element.removeAttribute('data-gamepad-focused');
            });
        };
        section?.addEventListener('pointerdown', clearGamepadFocus);

        return () => {
            gamepad?.off('analog', gamepadHandlerId);
            gamepad?.off('buttonA', gamepadHandlerId);
            section?.removeEventListener('pointerdown', clearGamepadFocus);
            clearGamepadFocus();
        };
    }, [gamepad, gamepadHandlerId, sectionRef]);
};

export default useContentGamepadNavigation;

const isVisibleAndEnabled = (element) => {
    if (element.tabIndex < 0 || element.matches(':disabled,[aria-disabled="true"]')) return false;
    if (element.closest('[hidden],[aria-hidden="true"]')) return false;

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
};

const getFocusableElements = (scope) => Array.from(
    scope?.querySelectorAll('[tabindex]:not([data-focus-guard])') || []
).filter(isVisibleAndEnabled);

const overlaps = (startA, endA, startB, endB) => startA < endB && endA > startB;

const getDirectionalCandidate = (elements, activeElement, direction) => {
    if (!activeElement) return elements[0] || null;

    const current = activeElement.getBoundingClientRect();
    const currentX = current.left + current.width / 2;
    const currentY = current.top + current.height / 2;
    const horizontal = direction === 'left' || direction === 'right';
    let bestElement = null;
    let bestScore = Infinity;

    elements.forEach((element) => {
        if (element === activeElement) return;

        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const inDirection = direction === 'left' ? x < currentX
            : direction === 'right' ? x > currentX
                : direction === 'up' ? y < currentY
                    : y > currentY;
        if (!inDirection) return;

        const primaryGap = direction === 'left' ? Math.max(0, current.left - rect.right)
            : direction === 'right' ? Math.max(0, rect.left - current.right)
                : direction === 'up' ? Math.max(0, current.top - rect.bottom)
                    : Math.max(0, rect.top - current.bottom);
        const crossAxisOverlap = horizontal
            ? overlaps(current.top, current.bottom, rect.top, rect.bottom)
            : overlaps(current.left, current.right, rect.left, rect.right);
        const crossAxisGap = horizontal
            ? Math.max(0, Math.max(current.top - rect.bottom, rect.top - current.bottom))
            : Math.max(0, Math.max(current.left - rect.right, rect.left - current.right));
        const crossAxisCenterDistance = horizontal ? Math.abs(y - currentY) : Math.abs(x - currentX);
        const score = primaryGap + (crossAxisOverlap ? 0 : crossAxisGap * 4) + crossAxisCenterDistance * 0.15;

        if (score < bestScore) {
            bestScore = score;
            bestElement = element;
        }
    });

    return bestElement;
};

const focusWithGamepadIndicator = (element, scope) => {
    scope?.querySelectorAll('[data-gamepad-focused="true"]').forEach((focused) => {
        if (focused !== element) focused.removeAttribute('data-gamepad-focused');
    });
    element?.setAttribute('data-gamepad-focused', 'true');
    element?.focus();
};

module.exports = { getFocusableElements, getDirectionalCandidate, focusWithGamepadIndicator };

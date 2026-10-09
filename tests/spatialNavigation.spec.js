/* global describe, test, expect */

const { getDirectionalCandidate } = require('../src/services/GamepadNavigation/spatialNavigation');

const element = (left, top, width, height, name) => ({
    name,
    getBoundingClientRect: () => ({
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
    }),
});

describe('gamepad spatial navigation', () => {
    test('prefers a farther item in the same row over a nearby diagonal item', () => {
        const current = element(0, 0, 100, 100, 'current');
        const diagonal = element(110, 110, 80, 80, 'diagonal');
        const sameRow = element(160, 0, 100, 100, 'same-row');

        expect(getDirectionalCandidate([current, diagonal, sameRow], current, 'right'))
            .toBe(sameRow);
    });

    test('keeps focus at the edge instead of wrapping in the opposite direction', () => {
        const current = element(0, 0, 100, 100, 'current');
        const behind = element(-120, 0, 100, 100, 'behind');

        expect(getDirectionalCandidate([current, behind], current, 'right')).toBeNull();
    });

    test('uses the first eligible item when the scope has no current focus', () => {
        const first = element(0, 0, 100, 100, 'first');
        const second = element(120, 0, 100, 100, 'second');

        expect(getDirectionalCandidate([first, second], null, 'down')).toBe(first);
    });
});

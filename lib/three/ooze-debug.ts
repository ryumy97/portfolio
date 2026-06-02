export type OozeDebugState = {
	oozeY: number;
	clipY: number;
	wave1: number;
	wave2: number;
	wave3: number;
	speed: number;
	planeSize: number;
	segments: number;
	wireframe: boolean;
	showPool: boolean;
	showHelpers: boolean;
	color: string;
	opacity: number;
	transmission: number;
};

export const OOZE_DEBUG_DEFAULTS: OozeDebugState = {
	oozeY: 0,
	clipY: -0.3,
	wave1: 0.028,
	wave2: 0.02,
	wave3: 0.015,
	speed: 1,
	planeSize: 12,
	segments: 96,
	wireframe: false,
	showPool: true,
	showHelpers: true,
	color: "#f06058",
	opacity: 0.92,
	transmission: 0.35,
};

export function createOozeDebugState(
	overrides?: Partial<OozeDebugState>,
): OozeDebugState {
	return { ...OOZE_DEBUG_DEFAULTS, ...overrides };
}

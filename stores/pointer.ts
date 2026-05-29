type PointerValues = {
	x: number;
	y: number;
	width: number;
	height: number;
	borderRadius: number;
};

type PointerState = {
	current: PointerValues;
	target: PointerValues;
	hover: boolean;
};

export const pointer: PointerState = {
	current: {
		x: -12,
		y: -12,
		width: 12,
		height: 12,
		borderRadius: 9999,
	},
	target: {
		x: -12,
		y: -12,
		width: 12,
		height: 12,
		borderRadius: 9999,
	},
	hover: false,
};

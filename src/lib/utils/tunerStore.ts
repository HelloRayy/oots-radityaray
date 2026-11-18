export interface LenisTune {
	duration: number;
	lerp: number;
	wheelMultiplier: number;
	touchMultiplier: number;
}

export interface Page2Tune {
	curl: number;
	windSpeed: number;
	scrollWind: number;
	shadowOpacity: number;
	handCharDelay: number;
}

export const DEFAULT_LENIS_TUNE: LenisTune = {
	duration: 1.8,
	lerp: 0.1,
	wheelMultiplier: 1.0,
	touchMultiplier: 1.0
};

export const DEFAULT_PAGE2_TUNE: Page2Tune = {
	curl: 0.14,
	windSpeed: 1.0,
	scrollWind: 1.1,
	shadowOpacity: 0.2,
	handCharDelay: 0.06
};

export const liveTune = {
	lenis: { ...DEFAULT_LENIS_TUNE },
	page2: { ...DEFAULT_PAGE2_TUNE }
};

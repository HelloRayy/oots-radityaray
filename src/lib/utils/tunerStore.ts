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
	duration: 1.65,
	lerp: 0.22,
	wheelMultiplier: 2.2,
	touchMultiplier: 1
};

export const DEFAULT_PAGE2_TUNE: Page2Tune = {
	curl: 0.32,
	windSpeed: 2.5,
	scrollWind: 0,
	shadowOpacity: 0.5,
	handCharDelay: 0.06
};

export const liveTune = {
	lenis: { ...DEFAULT_LENIS_TUNE },
	page2: { ...DEFAULT_PAGE2_TUNE }
};

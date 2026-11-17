const REVEALED_EVENT = 'sweettape:revealed';
const SWEEPING_EVENT = 'sweettape:sweeping';
const HOLDING_EVENT = 'sweettape:holding';

let sweptOrReleased = false;

export function isHeld(): boolean {
	return typeof document !== 'undefined' && document.documentElement.dataset.loading !== undefined;
}

export function hold(): void {
	sweptOrReleased = false;
	document.documentElement.dataset.loading = '';
	window.dispatchEvent(new Event(HOLDING_EVENT));
}

export function startSweep(): void {
	sweptOrReleased = true;
	window.dispatchEvent(new Event(SWEEPING_EVENT));
}

export function release(): void {
	sweptOrReleased = true;
	delete document.documentElement.dataset.loading;
	window.dispatchEvent(new Event(REVEALED_EVENT));
}

export function onHold(callback: () => void): () => void {
	const controller = new AbortController();
	window.addEventListener(HOLDING_EVENT, callback, { signal: controller.signal });
	return () => controller.abort();
}

export function whenSweeping(callback: () => void): () => void {
	if (!isHeld() || sweptOrReleased) {
		callback();
		return () => {};
	}
	const controller = new AbortController();
	window.addEventListener(SWEEPING_EVENT, callback, { once: true, signal: controller.signal });
	return () => controller.abort();
}

export function whenRevealed(callback: () => void): () => void {
	if (!isHeld()) {
		callback();
		return () => {};
	}
	const controller = new AbortController();
	window.addEventListener(REVEALED_EVENT, callback, { once: true, signal: controller.signal });
	return () => controller.abort();
}

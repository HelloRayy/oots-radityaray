<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { isHeld, release, startSweep } from '#lib/utils/reveal.ts';

	interface TapeLayer {
		id: string;
		bg: string;
	}

	interface StickerPose {
		scale: number;
		rotX: number;
		y: number;
		alpha: number;
		bend: number;
		fold: number;
		wave: number;
		phase: number;
		sheen: number;
	}

	const TAPE_LAYERS: TapeLayer[] = [
		{ id: 'stationery', bg: '#FF7B5F' },
		{ id: 'masking', bg: '#fa8005' },
		{ id: 'opp-quiet', bg: '#F7D000' },
		{ id: 'opp', bg: '#b6fe00' },
		{ id: 'double', bg: '#50CBFF' },
		{ id: 'cloth', bg: '#2E3EAC' }
	];

	const ENTER = {
		DURATION: 0.92,
		SCALE: 0.62,
		TILT: -78,
		RISE: 0.064,
		BACK: 2.8,
		BACK_TILT: 0.8,
		FADE: 0.28
	};

	const UNROLL = {
		FOLD: 1,
		FOLD_AT: 0.31,
		CREASE: 0.09,
		BEND: 1.85,
		WAVE: 0.35,
		FREQ: 1.95,
		SPIN: 0.3,
		START: 0.26,
		UNROLL: 0.74,
		REBOUND: {
			DEPTH: 0.72,
			DURATION: 0.4
		},
		SETTLE: 2,
		RUBBER: 0.42
	};

	const SHEEN_START = 0;
	const SHEEN_DURATION = 1.06;
	const SHEEN_WIDTH = 30;
	const SHEEN_ALPHA = 0.16;
	const SHEEN_ANGLE = 118;
	const STICKER_DELAY = 1;
	const PEEL_EASE = 'power3.inOut';
	const STRIPS = 64;

	let rootEl: HTMLDivElement | null = null;
	let markEl: HTMLDivElement | null = null;

	function computeStagger(
		elements: HTMLElement[],
		opts: { at: number; step: number; spread: number; duration: number; drag: number }
	) {
		let at = opts.at;
		return elements.map((el, index) => {
			if (index > 0) {
				const jitter = (((0.6180339887 * index) % 1) * 2 - 1) * opts.spread;
				at += opts.step * (1 + jitter);
			}
			return {
				el,
				at,
				duration: opts.duration * (1 + index * opts.drag)
			};
		});
	}

	function createStickerRig(host: HTMLElement, src: string) {
		const pose: StickerPose = {
			scale: ENTER.SCALE,
			rotX: ENTER.TILT,
			y: 0,
			alpha: 0,
			bend: UNROLL.BEND,
			fold: UNROLL.FOLD,
			wave: UNROLL.WAVE,
			phase: 0,
			sheen: 0
		};

		const sticker = document.createElement('div');
		sticker.className = 'preloader-sticker';
		sticker.style.opacity = '0';

		const cols: HTMLDivElement[] = [];
		const inks: HTMLDivElement[] = [];
		const sheens: HTMLDivElement[] = [];
		const backs: HTMLDivElement[] = [];
		const frontFlags: boolean[] = [];

		const sheenGradient = `linear-gradient(${SHEEN_ANGLE}deg, rgba(255,255,255,0) ${50 - SHEEN_WIDTH}%, rgba(255,255,255,${SHEEN_ALPHA}) 50%, rgba(255,255,255,0) ${50 + SHEEN_WIDTH}%)`;

		for (let i = 0; i < STRIPS; i++) {
			const col = document.createElement('div');
			col.className = 'preloader-col';

			const ink = document.createElement('div');
			ink.className = 'preloader-ink';
			ink.style.backgroundImage = `url(${src})`;

			const sheen = document.createElement('div');
			sheen.className = 'preloader-sheen';
			sheen.style.backgroundImage = sheenGradient;
			sheen.style.webkitMaskImage = `url(${src})`;
			sheen.style.maskImage = `url(${src})`;

			const back = document.createElement('div');
			back.className = 'preloader-back';
			back.style.background = '#60a000';
			back.style.webkitMaskImage = `url(${src})`;
			back.style.maskImage = `url(${src})`;

			col.append(ink, sheen, back);
			sticker.append(col);
			cols.push(col);
			inks.push(ink);
			sheens.push(sheen);
			backs.push(back);
			frontFlags.push(true);
		}

		host.append(sticker);

		let width = 0;
		let height = 0;
		let colWidth = 0;

		const measure = () => {
			width = host.clientWidth;
			if (!width) return;
			height = (118 * width) / 191;
			colWidth = width / STRIPS;
			host.style.perspective = `${6.6 * width}px`;
			sticker.style.transformOrigin = '50% 25%';

			const fullSize = `${width}px ${height}px`;
			for (let i = 0; i < STRIPS; i++) {
				const pos = `${-(i * colWidth)}px 0`;
				const col = cols[i];
				col.style.left = `${i * colWidth}px`;
				col.style.width = `${colWidth + 1.3}px`;
				col.style.height = `${height}px`;

				inks[i].style.backgroundSize = fullSize;
				inks[i].style.backgroundPosition = pos;

				sheens[i].style.backgroundSize = fullSize;
				sheens[i].style.webkitMaskSize = fullSize;
				sheens[i].style.maskSize = fullSize;
				sheens[i].style.webkitMaskPosition = pos;
				sheens[i].style.maskPosition = pos;

				backs[i].style.webkitMaskSize = fullSize;
				backs[i].style.maskSize = fullSize;
				backs[i].style.webkitMaskPosition = pos;
				backs[i].style.maskPosition = pos;
			}
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(host);

		const angles = new Float64Array(STRIPS);
		const xs = new Float64Array(STRIPS);
		const zs = new Float64Array(STRIPS);

		const draw = () => {
			if (!width) return;

			sticker.style.opacity = String(pose.alpha);
			sticker.style.transform = `translate3d(0, ${pose.y.toFixed(2)}px, 0) rotateX(${pose.rotX.toFixed(2)}deg) scale(${pose.scale.toFixed(4)})`;

			let accX = 0;
			let accZ = 0;

			for (let i = 0; i < STRIPS; i++) {
				const norm = (i + 0.5) / STRIPS;
				let crease = (norm - (UNROLL.FOLD_AT - UNROLL.CREASE)) / (2 * UNROLL.CREASE);
				crease = crease < 0 ? 0 : crease > 1 ? 1 : crease;
				crease = crease * crease * (3 - 2 * crease);

				const angle =
					pose.bend * (norm - 0.5) +
					pose.fold * crease +
					pose.wave * Math.sin(2 * Math.PI * (UNROLL.FREQ * norm - pose.phase));

				const cosA = Math.cos(angle);
				const sinA = Math.sin(angle);

				angles[i] = angle;
				xs[i] = accX + (cosA * colWidth) / 2;
				zs[i] = accZ + (sinA * colWidth) / 2;
				accX += cosA * colWidth;
				accZ += sinA * colWidth;
			}

			const centerShift = (width - accX) / 2;
			const midZ = zs[STRIPS / 2];

			for (let i = 0; i < STRIPS; i++) {
				const dx = xs[i] + centerShift - (i * colWidth + colWidth / 2);
				cols[i].style.transform = `translate3d(${dx.toFixed(2)}px, 0, ${(zs[i] - midZ).toFixed(2)}px) rotateY(${(-(180 * angles[i]) / Math.PI).toFixed(2)}deg)`;

				const cosA = Math.cos(angles[i]);
				const frontShade = 1 - 0.48 * (1 - cosA);
				inks[i].style.filter = `brightness(${(frontShade < 0.2 ? 0.2 : frontShade).toFixed(3)})`;

				const facingFront = cosA >= 0;
				if (frontFlags[i] !== facingFront) {
					frontFlags[i] = facingFront;
					inks[i].style.opacity = facingFront ? '1' : '0';
					sheens[i].style.opacity = facingFront ? '1' : '0';
					backs[i].style.opacity = facingFront ? '0' : '1';
				}

				if (!facingFront) {
					const backShade = 1 - (1 + cosA);
					backs[i].style.filter = `brightness(${(backShade < 0.2 ? 0.2 : backShade).toFixed(3)})`;
				}

				sheens[i].style.backgroundPosition = `${(-(i * colWidth) + (2 * pose.sheen - 1) * width).toFixed(2)}px 0`;
			}
		};

		const destroy = () => {
			observer.disconnect();
			sticker.remove();
			host.style.removeProperty('perspective');
		};

		return { pose, draw, destroy };
	}

	onMount(() => {
		const root = rootEl;
		if (!root) return;

		if (!isHeld()) {
			gsap.set(root, { visibility: 'hidden' });
			return;
		}

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			release();
			return;
		}

		if (!window.location.hash) {
			if ('scrollRestoration' in history) {
				history.scrollRestoration = 'manual';
			}
			window.scrollTo(0, 0);
		}

		const mark = markEl;
		const sheet = root.querySelector<HTMLElement>('.preloader-sheet');
		const layers = Array.from(root.querySelectorAll<HTMLElement>('.preloader-layer'));
		const stack = [sheet, ...layers].filter((el): el is HTMLElement => el !== null);

		const elapsed = Math.max(performance.now() / 1000 - 1.2, 0);
		const peelAt = !mark ? 0.3 : Math.max(4.37 - elapsed, 2.9);

		gsap.ticker.lagSmoothing(250, 120);

		const tl = gsap.timeline();
		let stopDraw: (() => void) | null = null;
		let destroyRig: (() => void) | null = null;

		if (mark) {
			const src = mark.dataset.sticker;
			if (src) {
				const rig = createStickerRig(mark, src);
				const pose = rig.pose;

				gsap.ticker.add(rig.draw);
				stopDraw = () => gsap.ticker.remove(rig.draw);
				destroyRig = rig.destroy;

				const t0 = STICKER_DELAY;
				tl.set(mark, { autoAlpha: 0 }, 0);
				tl.set(mark, { autoAlpha: 1 }, t0);
				tl.set(
					pose,
					{
						scale: ENTER.SCALE,
						rotX: ENTER.TILT,
						y: () => ENTER.RISE * mark.clientWidth,
						alpha: 0,
						bend: UNROLL.BEND,
						fold: UNROLL.FOLD,
						wave: UNROLL.WAVE,
						phase: 0,
						sheen: 0
					},
					t0
				);

				tl.to(pose, { alpha: 1, duration: ENTER.DURATION * ENTER.FADE, ease: 'none' }, t0);
				tl.to(pose, { scale: 1, duration: ENTER.DURATION, ease: `back.out(${ENTER.BACK})` }, t0);
				tl.to(
					pose,
					{ rotX: 0, duration: ENTER.DURATION, ease: `back.out(${ENTER.BACK * ENTER.BACK_TILT})` },
					t0
				);
				tl.to(pose, { y: 0, duration: ENTER.DURATION, ease: 'power3.out' }, t0);

				const unrollAt = t0 + ENTER.DURATION * UNROLL.START;
				tl.to(pose, { fold: 0, duration: UNROLL.UNROLL, ease: 'sine.inOut' }, unrollAt);
				tl.to(
					pose,
					{ bend: -UNROLL.BEND * UNROLL.REBOUND.DEPTH, duration: UNROLL.UNROLL, ease: 'sine.inOut' },
					unrollAt
				);
				tl.to(
					pose,
					{ bend: 0, duration: UNROLL.REBOUND.DURATION, ease: 'sine.inOut' },
					unrollAt + UNROLL.UNROLL
				);
				tl.to(
					pose,
					{ wave: 0, duration: UNROLL.SETTLE, ease: `elastic.out(1, ${UNROLL.RUBBER})` },
					unrollAt
				);
				tl.to(pose, { phase: UNROLL.SPIN * UNROLL.SETTLE, duration: UNROLL.SETTLE, ease: 'none' }, t0);
				tl.to(pose, { sheen: 1, duration: SHEEN_DURATION, ease: 'power1.inOut' }, t0 + SHEEN_START);

				tl.call(
					() => stopDraw?.(),
					undefined,
					unrollAt + Math.max(UNROLL.SETTLE, UNROLL.UNROLL + UNROLL.REBOUND.DURATION)
				);
			}
		}

		const staggered = computeStagger(stack, {
			at: peelAt,
			step: 0.09,
			spread: 0.4,
			duration: 1.05,
			drag: 0.018
		});

		for (const item of staggered) {
			tl.to(item.el, { yPercent: -100, duration: item.duration, ease: PEEL_EASE }, item.at);
		}

		const last = staggered.at(-1) ?? { at: peelAt, duration: 1.05 };
		tl.call(startSweep, undefined, last.at + 0.33 * last.duration);
		tl.call(release, undefined, last.at + 0.55 * last.duration);

		if (mark) {
			tl.set(mark, { autoAlpha: 0 });
		}
		tl.set(root, { visibility: 'hidden' });
		tl.call(() => destroyRig?.());

		return () => {
			tl.kill();
			stopDraw?.();
			destroyRig?.();
			gsap.set(root, { clearProps: 'visibility' });
			gsap.set([...stack, ...(mark ? [mark] : [])], {
				clearProps: 'transform,opacity,visibility'
			});
		};
	});
</script>

<div class="site-preloader" bind:this={rootEl} aria-hidden="true">
	{#each TAPE_LAYERS as layer, i (layer.id)}
		<div
			class="preloader-layer arc-cut"
			data-tape={layer.id}
			style:background={layer.bg}
			style:z-index={TAPE_LAYERS.length - i}
		></div>
	{/each}
	<div class="preloader-sheet arc-cut" style:z-index={TAPE_LAYERS.length + 1}>
		<div
			class="preloader-mark"
			bind:this={markEl}
			data-sticker="/assets/preloader-image.svg"
		></div>
	</div>
</div>

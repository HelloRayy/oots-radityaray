<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import museHi from '#lib/assets/muse-hi.svg';
	import { whenRevealed, whenSweeping } from '#lib/utils/reveal.ts';

	const CORNER_LINES = ['CREATIVE DEVELOPER', 'PORTFOLIO WEBSITE'];
	const KICKER_LEFT = 'WELCOME';
	const KICKER_RIGHT = 'TO MY';
	const HERO_LINES = ['PORTFOLIO', 'WEBSITE'];

	const REVEAL = {
		HIDDEN: 130,
		DURATION: 0.85,
		STAGGER: 0.025,
		DELAY: 0.08,
		EASE: 'power3.out'
	};

	const CORNER = {
		DELAY: 0.12,
		PERF_DURATION: 0.5,
		PERF_EASE: 'power2.out',
		TEXT_AT: 0.12,
		STAGGER: 0.022
	};

	let sectionEl: HTMLElement | null = null;
	let heroImageEl: HTMLImageElement | null = null;

	const DEFAULT_TUNE = {
		radius: 220,
		liftY: -5,
		scale: 1.03,
		maxTilt: 2.5,
		duration: 0.45
	};

	let tunerOpen = $state(true);
	let copiedPrompt = $state(false);
	let tune = $state({ ...DEFAULT_TUNE });

	function resetTune() {
		tune = { ...DEFAULT_TUNE };
	}

	function copyForAI() {
		const text = [
			'Update the hero .h1 .char proximity hover motion in HeroTop.svelte with these exact values:',
			`- Radius: ${tune.radius}px`,
			`- Lift Y: ${tune.liftY}%`,
			`- Scale: ${tune.scale}`,
			`- Max Tilt: ${tune.maxTilt}deg`,
			`- Duration: ${tune.duration}s (ease: power3.out, smoothstep falloff)`
		].join('\n');
		navigator.clipboard?.writeText(text);
		copiedPrompt = true;
		setTimeout(() => (copiedPrompt = false), 1500);
	}

	function shuffle<T>(items: T[]): T[] {
		const copy = [...items];
		for (let i = copy.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[copy[i], copy[j]] = [copy[j], copy[i]];
		}
		return copy;
	}

	onMount(() => {
		const root = sectionEl;
		if (!root) return;

		const allChars = Array.from(root.querySelectorAll<HTMLElement>('.char'));
		const titleChars = Array.from(root.querySelectorAll<HTMLElement>('.title .char'));
		const h1Chars = Array.from(root.querySelectorAll<HTMLElement>('.h1 .char'));
		const cornerPerf = root.querySelector<HTMLElement>('.corner-perf');
		const cornerChars = Array.from(root.querySelectorAll<HTMLElement>('.corner-mark .char'));
		const heroMark = root.querySelector<HTMLElement>('.hero-mark');
		const heroImage = heroImageEl;

		if (allChars.length) {
			gsap.set(allChars, { y: 0, yPercent: REVEAL.HIDDEN });
		}
		root.dataset.reveal = 'live';

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			if (allChars.length) gsap.set(allChars, { clearProps: 'transform' });
			if (cornerPerf) gsap.set(cornerPerf, { clipPath: 'inset(0% 0% 0% 0%)' });
			if (heroImage) gsap.set(heroImage, { clearProps: 'transform,opacity' });
			return;
		}

		const titleTween = titleChars.length
			? gsap.fromTo(
					shuffle(titleChars),
					{ y: 0, yPercent: REVEAL.HIDDEN },
					{
						yPercent: 0,
						duration: REVEAL.DURATION,
						stagger: REVEAL.STAGGER,
						ease: REVEAL.EASE,
						paused: true
					}
				)
			: null;

		const cornerTl = gsap.timeline({ paused: true });
		if (cornerPerf) {
			cornerTl.fromTo(
				cornerPerf,
				{ clipPath: 'inset(0% 0% 100% 0%)' },
				{ clipPath: 'inset(0% 0% 0% 0%)', duration: CORNER.PERF_DURATION, ease: CORNER.PERF_EASE },
				0
			);
		}
		if (cornerChars.length) {
			cornerTl.fromTo(
				shuffle(cornerChars),
				{ y: 0, yPercent: REVEAL.HIDDEN },
				{ yPercent: 0, duration: REVEAL.DURATION, stagger: CORNER.STAGGER, ease: REVEAL.EASE },
				CORNER.TEXT_AT
			);
		}

		const isMobile = window.matchMedia('(max-width: 743px)').matches;
		const markTween = heroMark
			? gsap.fromTo(
					heroMark,
					isMobile
						? { scale: 0, rotateX: -55, transformPerspective: 600 }
						: { yPercent: -170, rotateX: -65, scale: 0.85, transformPerspective: 600 },
					{
						...(isMobile ? { scale: 1 } : { yPercent: 0, scale: 1 }),
						rotateX: 0,
						duration: 0.95,
						ease: 'back.out(1.6)',
						paused: true
					}
				)
			: null;

		const imageTween = heroImage
			? gsap.fromTo(
					heroImage,
					{ yPercent: 28, scale: 0.86, opacity: 0 },
					{ yPercent: 0, scale: 1, opacity: 1, duration: 1.15, ease: 'back.out(1.4)', paused: true }
				)
			: null;

		const hoverAbort = new AbortController();
		const h1El = root.querySelector<HTMLElement>('.h1');
		if (h1El && h1Chars.length) {
			const resetChars = () => {
				for (const charEl of h1Chars) {
					gsap.to(charEl, {
						yPercent: 0,
						scale: 1,
						rotation: 0,
						duration: Math.max(0.2, tune.duration * 1.15),
						ease: 'power3.out',
						overwrite: 'auto'
					});
				}
			};

			root.addEventListener(
				'pointermove',
				(e: PointerEvent) => {
					const radius = Math.max(20, tune.radius);
					for (const charEl of h1Chars) {
						const rect = charEl.getBoundingClientRect();
						const cx = rect.left + rect.width / 2;
						const cy = rect.top + rect.height / 2;
						const dx = e.clientX - cx;
						const dy = e.clientY - cy;
						const dist = Math.hypot(dx, dy);
						const raw = Math.max(0, 1 - dist / radius);
						const falloff = raw * raw * (3 - 2 * raw);

						if (falloff <= 0.001) {
							gsap.to(charEl, {
								yPercent: 0,
								scale: 1,
								rotation: 0,
								duration: tune.duration,
								ease: 'power3.out',
								overwrite: 'auto'
							});
							continue;
						}

						const dirX = Math.max(-1, Math.min(1, dx / radius));
						gsap.to(charEl, {
							yPercent: tune.liftY * falloff,
							scale: 1 + (tune.scale - 1) * falloff,
							rotation: dirX * tune.maxTilt * falloff,
							duration: tune.duration,
							ease: 'power3.out',
							overwrite: 'auto'
						});
					}
				},
				{ signal: hoverAbort.signal, passive: true }
			);

			root.addEventListener('pointerleave', resetChars, { signal: hoverAbort.signal });
		}

		const delayedCalls: gsap.core.Tween[] = [];
		const unsubSweep = whenSweeping(() => {
			if (imageTween) {
				imageTween.play();
			}
		});

		let driftAbort: AbortController | null = null;
		if (heroImage) {
			driftAbort = new AbortController();
			const qx = gsap.quickTo(heroImage, 'x', { duration: 0.8, ease: 'power3.out' });
			const qy = gsap.quickTo(heroImage, 'y', { duration: 0.8, ease: 'power3.out' });
			const qr = gsap.quickTo(heroImage, 'rotation', { duration: 0.9, ease: 'power3.out' });

			root.addEventListener(
				'pointermove',
				(e: PointerEvent) => {
					const nx = (e.clientX / window.innerWidth - 0.5) * 2;
					const ny = (e.clientY / window.innerHeight - 0.5) * 2;
					qx(nx * 14);
					qy(ny * 10);
					qr(nx * 2.2);
				},
				{ signal: driftAbort.signal, passive: true }
			);
		}

		const unsubReveal = whenRevealed(() => {
			if (titleTween) {
				delayedCalls.push(gsap.delayedCall(REVEAL.DELAY, () => titleTween.play()));
			}
			if (cornerPerf || cornerChars.length) {
				delayedCalls.push(gsap.delayedCall(CORNER.DELAY, () => cornerTl.play()));
			}
			if (markTween) {
				delayedCalls.push(gsap.delayedCall(0.45, () => markTween.play()));
			}
		});

		return () => {
			hoverAbort.abort();
			driftAbort?.abort();
			unsubSweep();
			unsubReveal();
			for (const dc of delayedCalls) dc.kill();
			titleTween?.kill();
			cornerTl.kill();
			markTween?.kill();
			imageTween?.kill();
			if (allChars.length) gsap.set(allChars, { clearProps: 'transform' });
			if (heroMark) gsap.set(heroMark, { clearProps: 'transform' });
			if (heroImage) gsap.set(heroImage, { clearProps: 'transform,opacity' });
			if (cornerPerf) gsap.set(cornerPerf, { clearProps: 'clipPath' });
		};
	});
</script>

<section class="hero-section" bind:this={sectionEl}>
	<div class="hero-wrapper">
		<div class="top">
			<div class="arc-foot" data-paper="true" aria-hidden="true"></div>

			<p class="corner-mark">
				<span class="sr-only">{CORNER_LINES.join(' ')}</span>
				<span class="corner-perf" aria-hidden="true"></span>
				{#each CORNER_LINES as line (line)}
					<span class="line" aria-hidden="true">
						{#each line.split('') as ch, i (i)}
							<span class="clip" style:--i={i}>
								<span class="char">{ch === ' ' ? '\u00A0' : ch}</span>
							</span>
						{/each}
					</span>
				{/each}
			</p>

			<div class="title">
				<p class="h4">
					<span class="sr-only">{KICKER_LEFT} {KICKER_RIGHT}</span>
					<span class="half" aria-hidden="true">
						{#each KICKER_LEFT.split('') as ch, i (i)}
							<span class="clip" style:--i={i}>
								<span class="char">{ch === ' ' ? '\u00A0' : ch}</span>
							</span>
						{/each}
					</span>
					<span class="hero-mark-slot" aria-hidden="true">
						<img
							class="hero-mark"
							src="/assets/preloader-image.svg"
							alt=""
							draggable="false"
						/>
					</span>
					<span class="half" aria-hidden="true">
						{#each KICKER_RIGHT.split('') as ch, i (i)}
							<span class="clip" style:--i={i}>
								<span class="char">{ch === ' ' ? '\u00A0' : ch}</span>
							</span>
						{/each}
					</span>
				</p>

				<div class="warped-text">
					<h1 class="h1" aria-label={HERO_LINES.join(' ')}>
						{#each HERO_LINES as line (line)}
							<span class="line" style:--letters={line.length}>
								{#each line.split('') as ch, i (i)}
									<span class="clip" style:--i={i}>
										<span class="char">{ch === ' ' ? '\u00A0' : ch}</span>
									</span>
								{/each}
							</span>
						{/each}
					</h1>
				</div>
			</div>

			<div class="hero-image-wrap" aria-hidden="true">
				<img
					class="hero-image"
					bind:this={heroImageEl}
					src={museHi}
					alt=""
					draggable="false"
				/>
			</div>
		</div>
	</div>

	<div class="hover-tuner" class:is-collapsed={!tunerOpen}>
		<div class="tuner-head">
			<button type="button" class="tuner-toggle" onclick={() => (tunerOpen = !tunerOpen)}>
				Hover Tuner {tunerOpen ? '[-]' : '[+]'}
			</button>
			{#if tunerOpen}
				<div class="tuner-actions">
					<button type="button" class="tuner-btn" onclick={resetTune}>Reset</button>
					<button type="button" class="tuner-btn is-accent" onclick={copyForAI}>
						{copiedPrompt ? 'Copied!' : 'Copy for AI'}
					</button>
				</div>
			{/if}
		</div>

		{#if tunerOpen}
			<div class="tuner-body">
				<label class="tuner-row">
					<span>Radius ({tune.radius}px)</span>
					<input type="range" min="60" max="420" step="10" bind:value={tune.radius} />
				</label>
				<label class="tuner-row">
					<span>Lift Y ({tune.liftY}%)</span>
					<input type="range" min="-20" max="0" step="1" bind:value={tune.liftY} />
				</label>
				<label class="tuner-row">
					<span>Scale ({tune.scale.toFixed(2)})</span>
					<input type="range" min="1" max="1.15" step="0.01" bind:value={tune.scale} />
				</label>
				<label class="tuner-row">
					<span>Max Tilt ({tune.maxTilt}deg)</span>
					<input type="range" min="0" max="10" step="0.5" bind:value={tune.maxTilt} />
				</label>
				<label class="tuner-row">
					<span>Duration ({tune.duration.toFixed(2)}s)</span>
					<input type="range" min="0.15" max="1" step="0.05" bind:value={tune.duration} />
				</label>
			</div>
		{/if}
	</div>
</section>

<style>
	.hover-tuner {
		position: fixed;
		right: 16px;
		bottom: 16px;
		z-index: 90;
		width: 250px;
		background: rgba(1, 41, 0, 0.94);
		color: #f4fbe8;
		border: 1px solid rgba(182, 254, 0, 0.45);
		border-radius: 10px;
		padding: 10px 12px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 12px;
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
	}

	.hover-tuner.is-collapsed {
		width: auto;
	}

	.tuner-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.tuner-toggle {
		background: none;
		border: none;
		color: #b6fe00;
		font-weight: 700;
		cursor: pointer;
		padding: 0;
		font-size: 12px;
	}

	.tuner-actions {
		display: flex;
		gap: 6px;
	}

	.tuner-btn {
		border: none;
		border-radius: 6px;
		padding: 4px 8px;
		font-size: 11px;
		font-weight: 700;
		cursor: pointer;
		background: rgba(255, 255, 255, 0.14);
		color: #fff;
	}

	.tuner-btn.is-accent {
		background: #b6fe00;
		color: #013900;
	}

	.tuner-body {
		margin-top: 10px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.tuner-row {
		display: flex;
		flex-direction: column;
		gap: 3px;
		font-size: 11px;
	}

	.tuner-row input[type='range'] {
		width: 100%;
		accent-color: #b6fe00;
		cursor: pointer;
	}
</style>

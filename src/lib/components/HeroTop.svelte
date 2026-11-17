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

	let tuneOpen = $state(true);
	let museWidth = $state(34);
	let museBottom = $state(-4.5);
	let museOffsetX = $state(0);
	let copied = $state(false);

	function copyTuneValues() {
		const text = `width: ${museWidth}vw; bottom: ${museBottom}vw; offsetX: ${museOffsetX}vw;`;
		navigator.clipboard?.writeText(text);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 1500);
	}

	function resetTuneValues() {
		museWidth = 34;
		museBottom = -4.5;
		museOffsetX = 0;
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

		const delayedCalls: gsap.core.Tween[] = [];
		const unsubSweep = whenSweeping(() => {
			if (imageTween) {
				imageTween.play();
			}
		});

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

			<div
				class="hero-image-wrap"
				aria-hidden="true"
				style:width="{museWidth}vw"
				style:bottom="{museBottom}vw"
				style:transform="translateX(calc(-50% + {museOffsetX}vw))"
			>
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

	<div class="fixed right-4 bottom-4 z-[600] w-64 rounded-xl border border-[#b6fe00]/30 bg-[#012900]/95 p-3 text-xs text-white shadow-2xl backdrop-blur">
		<div class="mb-2 flex items-center justify-between">
			<span class="font-bold tracking-wide text-[#b6fe00] uppercase">Muse Tuner</span>
			<button
				type="button"
				onclick={() => (tuneOpen = !tuneOpen)}
				class="rounded bg-white/10 px-2 py-0.5 text-[11px] hover:bg-white/20"
			>
				{tuneOpen ? 'Hide' : 'Show'}
			</button>
		</div>

		{#if tuneOpen}
			<div class="space-y-2.5">
				<label class="block">
					<div class="mb-0.5 flex justify-between text-[11px] text-white/80">
						<span>Width</span>
						<span class="font-mono text-[#b6fe00]">{museWidth}vw</span>
					</div>
					<input
						type="range"
						min="15"
						max="60"
						step="0.5"
						bind:value={museWidth}
						class="w-full accent-[#b6fe00]"
					/>
				</label>

				<label class="block">
					<div class="mb-0.5 flex justify-between text-[11px] text-white/80">
						<span>Bottom</span>
						<span class="font-mono text-[#b6fe00]">{museBottom}vw</span>
					</div>
					<input
						type="range"
						min="-20"
						max="20"
						step="0.5"
						bind:value={museBottom}
						class="w-full accent-[#b6fe00]"
					/>
				</label>

				<label class="block">
					<div class="mb-0.5 flex justify-between text-[11px] text-white/80">
						<span>Offset X</span>
						<span class="font-mono text-[#b6fe00]">{museOffsetX}vw</span>
					</div>
					<input
						type="range"
						min="-25"
						max="25"
						step="0.5"
						bind:value={museOffsetX}
						class="w-full accent-[#b6fe00]"
					/>
				</label>

				<div class="rounded bg-black/40 p-1.5 font-mono text-[10px] text-[#b6fe00]/90">
					width: {museWidth}vw; bottom: {museBottom}vw; offsetX: {museOffsetX}vw;
				</div>

				<div class="flex gap-1.5 pt-0.5">
					<button
						type="button"
						onclick={copyTuneValues}
						class="flex-1 rounded bg-[#b6fe00] py-1.5 font-bold text-[#013900] transition hover:brightness-110"
					>
						{copied ? 'Copied!' : 'Copy Values'}
					</button>
					<button
						type="button"
						onclick={resetTuneValues}
						class="rounded bg-white/10 px-2.5 py-1.5 text-white/80 hover:bg-white/20"
					>
						Reset
					</button>
				</div>
			</div>
		{/if}
	</div>
</section>

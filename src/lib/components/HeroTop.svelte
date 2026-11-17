<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { whenRevealed } from '#lib/utils/reveal.ts';

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

		if (allChars.length) {
			gsap.set(allChars, { y: 0, yPercent: REVEAL.HIDDEN });
		}
		root.dataset.reveal = 'live';

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			if (allChars.length) gsap.set(allChars, { clearProps: 'transform' });
			if (cornerPerf) gsap.set(cornerPerf, { clipPath: 'inset(0% 0% 0% 0%)' });
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
					isMobile ? { scale: 0 } : { yPercent: -170 },
					{
						...(isMobile ? { scale: 1 } : { yPercent: 0 }),
						duration: 0.85,
						ease: 'back.out(1.6)',
						paused: true
					}
				)
			: null;

		const delayedCalls: gsap.core.Tween[] = [];
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
			unsubReveal();
			for (const dc of delayedCalls) dc.kill();
			titleTween?.kill();
			cornerTl.kill();
			markTween?.kill();
			if (allChars.length) gsap.set(allChars, { clearProps: 'transform' });
			if (heroMark) gsap.set(heroMark, { clearProps: 'transform' });
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
		</div>
	</div>
</section>

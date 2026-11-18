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

	const HEADLINE_DEFAULTS = {
		fontSize: 21,
		letterSpacing: 0,
		arcDrop: 2.1,
		arcTilt: 7.5,
		marginTop: 3.4,
		radius: 520,
		liftY: -18,
		scale: 1.15,
		maxTilt: 10,
		duration: 0.8
	};

	const hl = HEADLINE_DEFAULTS;

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
			const charNodes = h1Chars.map((el) => ({
				el,
				cx: 0,
				cy: 0,
				qy: gsap.quickTo(el, 'yPercent', { duration: hl.duration, ease: 'power3.out' }),
				qs: gsap.quickTo(el, 'scale', { duration: hl.duration, ease: 'power3.out' }),
				qr: gsap.quickTo(el, 'rotation', { duration: hl.duration, ease: 'power3.out' })
			}));

			const measureChars = () => {
				const sy = window.scrollY;
				for (const node of charNodes) {
					const target = node.el.parentElement ?? node.el;
					const rect = target.getBoundingClientRect();
					node.cx = rect.left + rect.width / 2;
					node.cy = rect.top + sy + rect.height / 2;
				}
			};
			measureChars();
			window.addEventListener('resize', measureChars, { signal: hoverAbort.signal, passive: true });

			const resetChars = () => {
				for (const node of charNodes) {
					node.qy(0);
					node.qs(1);
					node.qr(0);
				}
			};

			let hoverRaf = 0;
			let lastPx = 0;
			let lastPy = 0;

			const applyHoverFrame = () => {
				hoverRaf = 0;
				const radius = Math.max(20, hl.radius);
				const sy = window.scrollY;
				for (const node of charNodes) {
					const dx = lastPx - node.cx;
					const dy = lastPy + sy - node.cy;
					const dist = Math.hypot(dx, dy);
					const raw = Math.max(0, 1 - dist / radius);
					const falloff = raw * raw * (3 - 2 * raw);

					if (falloff <= 0.001) {
						node.qy(0);
						node.qs(1);
						node.qr(0);
						continue;
					}

					const dirX = Math.max(-1, Math.min(1, dx / radius));
					node.qy(hl.liftY * falloff);
					node.qs(1 + (hl.scale - 1) * falloff);
					node.qr(dirX * hl.maxTilt * falloff);
				}
			};

			root.addEventListener(
				'pointermove',
				(e: PointerEvent) => {
					lastPx = e.clientX;
					lastPy = e.clientY;
					if (!hoverRaf) hoverRaf = requestAnimationFrame(applyHoverFrame);
				},
				{ signal: hoverAbort.signal, passive: true }
			);

			root.addEventListener(
				'pointerleave',
				() => {
					if (hoverRaf) {
						cancelAnimationFrame(hoverRaf);
						hoverRaf = 0;
					}
					resetChars();
				},
				{ signal: hoverAbort.signal }
			);
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

				<div
					class="warped-text"
					style:--arc-drop="{hl.arcDrop}vw"
					style:--arc-tilt="{hl.arcTilt}deg"
					style:margin-top="{hl.marginTop}vw"
				>
					<h1
						class="h1"
						style:font-size="{hl.fontSize}vw"
						style:letter-spacing="{hl.letterSpacing}em"
						aria-label={HERO_LINES.join(' ')}
					>
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
</section>

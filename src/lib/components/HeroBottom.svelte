<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { whenRevealed } from '#lib/utils/reveal.ts';
	import { mountStickyNote } from '#lib/utils/stickyNote.ts';

	const NOTE_TITLE = 'TO-DO LIST';
	const NOTE_ITEMS = ['ship new portfolio', 'polish gsap motion', 'reply client emails'];

	const CARDBOARD_WORDS = [
		'PIXEL',
		'OBSESSION,',
		'JANKY',
		'CODE',
		'RESCUE,',
		'SNAPPY',
		'MOTION.',
		'ZERO',
		'BORING',
		'TEMPLATES.'
	];

	const HAND_LINES = [
		'handcrafted code.',
		'obsessive details.',
		'built to feel alive,',
		'not just work.'
	];

	let rootEl: HTMLElement | null = null;
	let noteEl: HTMLElement | null = null;

	onMount(() => {
		const root = rootEl;
		if (!root) return;
		gsap.registerPlugin(ScrollTrigger);

		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const chars = Array.from(root.querySelectorAll<HTMLElement>('.cb-copy .char'));
		if (reduce) {
			gsap.set(chars, { clearProps: 'transform' });
			return;
		}

		const ctx = gsap.context(() => {
			// Cardboard headline: scrubbed line-by-line rise
			const tops = chars.map((c) => (c.parentElement ?? c).offsetTop);
			const minTop = Math.min(...tops);
			const span = Math.max(Math.max(...tops) - minTop, 1);
			const cbTl = gsap.timeline({
				scrollTrigger: { trigger: '.cb-wrap', start: 'top 90%', end: 'center 60%', scrub: 0.6 }
			});
			chars.forEach((c, i) => {
				cbTl.from(
					c,
					{ yPercent: 115, opacity: 0, duration: 0.45, ease: 'power3.out', immediateRender: false },
					((tops[i] - minTop) / span) * 0.9
				);
			});

			// Sticky note drops in
			gsap.from('.note', {
				yPercent: -18,
				rotate: -6,
				opacity: 0,
				duration: 1.1,
				ease: 'back.out(1.6)',
				scrollTrigger: { trigger: '.note', start: 'top 85%', once: true }
			});

			// Scroll-driven tape peel on note & lemon
			gsap.utils.toArray<HTMLElement>('.tape-strip').forEach((el) => {
				gsap.fromTo(
					el,
					{
						clipPath: 'inset(0 100% 0 0)',
						rotateX: -28,
						y: -6,
						transformPerspective: 600,
						transformOrigin: 'left center'
					},
					{
						clipPath: 'inset(0 0% 0 0)',
						rotateX: 0,
						y: 0,
						ease: 'power2.out',
						scrollTrigger: { trigger: el, start: 'top 72%', end: 'top 28%', scrub: 1.1 }
					}
				);
			});

			// Hand note: rule X/Y draw + char-by-char typing animation (sweet-tape.com)
			const handNote = root.querySelector<HTMLElement>('.hand-note');
			const handInk = root.querySelector<HTMLElement>('.hand-ink');
			const ruleX = root.querySelector<HTMLElement>('.hand-rule--x');
			const ruleY = root.querySelector<HTMLElement>('.hand-rule--y');
			if (handNote && handInk && ruleX && ruleY) {
				const lineEls = Array.from(handInk.querySelectorAll<HTMLElement>('.hand-line'));
				const charMatrix = lineEls.map((lineEl) => {
					const text = lineEl.textContent ?? '';
					lineEl.textContent = '';
					return Array.from(text, (ch) => {
						const span = document.createElement('span');
						span.textContent = ch;
						lineEl.appendChild(span);
						return span;
					});
				});

				const allHandChars = charMatrix.flat();
				gsap.set(allHandChars, { visibility: 'hidden' });

				const handTl = gsap.timeline({ paused: true });
				const rw = ruleX.getBoundingClientRect().width;
				const rh = ruleY.getBoundingClientRect().height;
				const ruleTotal = 0.42;
				handTl.fromTo(ruleX, { scaleX: 0 }, { scaleX: 1, duration: (ruleTotal * rw) / (rw + rh || 1), ease: 'none', transformOrigin: 'left center' }, 0);
				handTl.fromTo(ruleY, { scaleY: 0 }, { scaleY: 1, duration: (ruleTotal * rh) / (rw + rh || 1), ease: 'none', transformOrigin: 'top center' }, 0);

				let cursor = handTl.duration() + 0.14;
				const charStep = 0.06;
				const lineBreak = 0.18;
				charMatrix.forEach((charsInLine, idx) => {
					if (idx > 0) cursor += lineBreak;
					for (const chSpan of charsInLine) {
						handTl.set(chSpan, { visibility: 'visible' }, cursor);
						cursor += charStep;
					}
				});

				ScrollTrigger.create({
					trigger: handNote,
					start: 'top 85%',
					end: 'bottom top',
					onEnter: () => handTl.play(0),
					onEnterBack: () => handTl.play(0),
					onLeave: () => handTl.pause(0),
					onLeaveBack: () => handTl.pause(0)
				});
			}

			// Smooth inertia parallax props (scrub: 1.2)
			gsap.to('#gift', {
				yPercent: -14,
				ease: 'none',
				scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 1.2 }
			});
			gsap.to('#lemon', {
				yPercent: -8,
				ease: 'none',
				scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 1.2 }
			});
			gsap.to('#paperclip', {
				rotate: 10,
				yPercent: -5,
				ease: 'none',
				scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 1.2 }
			});
		}, root);

		const unmountNote = noteEl ? mountStickyNote(noteEl, NOTE_TITLE, NOTE_ITEMS) : () => {};

		// Tactile hover poke on paperclip and gift
		const pokeAbort = new AbortController();
		const pokeTargets = [
			{ sel: '#paperclip', hover: { rotate: -12, scale: 1.1 }, rest: { rotate: 0, scale: 1 } },
			{ sel: '#gift', hover: { rotate: -2, scale: 1.03 }, rest: { rotate: 0, scale: 1 } }
		];
		for (const item of pokeTargets) {
			const el = root.querySelector<HTMLElement>(item.sel);
			if (!el) continue;
			el.style.cursor = 'pointer';
			el.addEventListener(
				'pointerenter',
				() => gsap.to(el, { ...item.hover, duration: 0.45, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' }),
				{ signal: pokeAbort.signal }
			);
			el.addEventListener(
				'pointerleave',
				() => gsap.to(el, { ...item.rest, duration: 0.55, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' }),
				{ signal: pokeAbort.signal }
			);
		}

		const unsubReveal = whenRevealed(() => {
			ScrollTrigger.refresh();
		});

		return () => {
			unmountNote();
			unsubReveal();
			pokeAbort.abort();
			ctx.revert();
		};
	});
</script>

<section class="bottom-part" bind:this={rootEl}>
	<!-- Sticky note (3D WebGL curled mesh + VSM drop shadow) -->
	<div class="note" bind:this={noteEl} aria-hidden="true"></div>
	<div class="sr-only">
		<p>{NOTE_TITLE}</p>
		<ul>
			{#each NOTE_ITEMS as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
	</div>
	<img class="tape-strip" id="tape-on-note" src="/assets/masking-tape-x2.png" alt="" draggable="false" />
	<img id="paperclip" src="/assets/paper-clip-1.webp" alt="" draggable="false" />

	<!-- Hand note -->
	<div class="hand-note">
		<span class="sr-only">{HAND_LINES.join(' ')}</span>
		<div class="hand-ink" aria-hidden="true">
			<svg class="hand-rule hand-rule--x" viewBox="0 0 100 10" preserveAspectRatio="none">
				<path d="M 0 3 C 30 8 65 8 100 1" />
			</svg>
			<svg class="hand-rule hand-rule--y" viewBox="0 0 10 100" preserveAspectRatio="none">
				<path d="M 6 0 C 2 33 3 70 6 100" />
			</svg>
			{#each HAND_LINES as line (line)}
				<span class="hand-line">{line}</span>
			{/each}
		</div>
	</div>

	<!-- Lemon painting + tape -->
	<img id="lemon" src="/assets/lemon-painting.webp" alt="" draggable="false" />
	<img class="tape-strip" id="tape-on-lemon" src="/assets/tape-on-lemon.webp" alt="" draggable="false" />

	<!-- Cardboard -->
	<div class="cb-wrap">
		<img class="cb-bg" src="/assets/cardboard.webp" alt="" draggable="false" />
		<h2 class="cb-copy" aria-label={CARDBOARD_WORDS.join(' ')}>
			<span aria-hidden="true">
				{#each CARDBOARD_WORDS as word, w (w)}
					<span class="word">
						{#each word.split('') as ch, i (i)}
							<span class="clip"><span class="char">{ch}</span></span>
						{/each}
					</span>{' '}
				{/each}
			</span>
		</h2>
	</div>
	<img class="tape-strip" id="tape-top" src="/assets/opp-tape-x4.png" alt="" draggable="false" />

	<!-- Gift -->
	<img id="gift" src="/assets/gift.webp" alt="" draggable="false" />
</section>

<style>
	.bottom-part {
		--drop-ink: #00000057;
		position: relative;
		width: 100%;
		height: 126.056vw;
		overflow-x: clip;
		contain: layout style paint;
		z-index: 1;
	}

	.tape-strip,
	#gift,
	#lemon,
	#paperclip {
		will-change: transform, clip-path;
		backface-visibility: hidden;
	}

	img {
		max-width: none;
		display: block;
		user-select: none;
	}

	/* Sticky note (3D WebGL container) */
	.note {
		position: absolute;
		top: 5.5vw;
		left: -2.2vw;
		width: 38.5vw;
		aspect-ratio: 1 / 0.94;
		rotate: 3deg;
		pointer-events: none;
		z-index: 2;
	}

	.note :global(canvas) {
		width: 100%;
		height: 100%;
		display: block;
	}

	#tape-on-note {
		position: absolute;
		top: 12.2vw;
		left: 11vw;
		width: 11vw;
		z-index: 5;
		rotate: -2deg;
		filter: drop-shadow(0.18vw 0.38vw 0.22vw rgba(0, 0, 0, 0.35));
	}

	#paperclip {
		position: absolute;
		top: 27.5vw;
		left: 3vw;
		width: 8.216vw;
		height: 9.043vw;
		z-index: 3;
		filter: drop-shadow(0.24vw 0.62vw 0.02vw var(--drop-ink));
	}

	/* Hand note */
	.hand-note {
		position: absolute;
		top: 50.9vw;
		left: 1.5vw;
		width: 18vw;
		z-index: 2;
		color: #b6fe00;
	}

	.hand-ink {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 1.4vw 0 0 2.4vw;
		font-family: 'Nothing You Could Do', cursive;
		font-size: 1.45vw;
		font-weight: 700;
		line-height: 1.3;
		transform: rotate(-8deg);
	}

	.hand-rule {
		position: absolute;
		fill: none;
		stroke: #b6fe00;
		stroke-width: 1.2;
		stroke-dasharray: 120;
		overflow: visible;
	}

	.hand-rule--x {
		top: 0.4vw;
		left: 0;
		width: 100%;
		height: 1vw;
	}

	.hand-rule--y {
		top: -1vw;
		left: 1.2vw;
		width: 1vw;
		height: 9vw;
	}

	.hand-line {
		display: block;
	}

	/* Lemon */
	#lemon {
		position: absolute;
		left: 0;
		bottom: 24vw;
		width: 45.46vw;
		object-fit: cover;
		z-index: 1;
	}

	#tape-on-lemon {
		position: absolute;
		top: 54.9vw;
		left: 22vw;
		width: 19vw;
		z-index: 4;
		rotate: 17deg;
		filter: drop-shadow(0.18vw 0.38vw 0.22vw rgba(0, 0, 0, 0.35));
	}

	/* Cardboard */
	.cb-wrap {
		position: absolute;
		top: 22.46vw;
		right: 0;
		width: 51.369vw;
		height: 65.452vw;
		z-index: 0;
	}

	.cb-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.cb-copy {
		position: absolute;
		top: 7.778vw;
		left: 11.028vw;
		max-width: 34.442vw;
		margin: 0;
		transform: rotate(-0.628deg);
		font-family: var(--font-heading);
		color: #754402;
		font-size: 6.071vw;
		font-weight: 900;
		line-height: 0.79;
		letter-spacing: -0.182vw;
		text-transform: uppercase;
	}

	.cb-copy .word {
		display: inline-flex;
	}

	.cb-copy .clip {
		display: block;
		overflow: hidden;
		margin: -0.15em -0.04em 0;
		padding: 0.15em 0.04em 0;
	}

	.cb-copy .char {
		display: block;
	}

	#tape-top {
		position: absolute;
		top: 15.9vw;
		right: -5vw;
		width: 42.126vw;
		height: 8.74vw;
		object-fit: cover;
		z-index: 10;
		opacity: 0.82;
		filter: drop-shadow(0.15vw 0.3vw 0.2vw rgba(0, 0, 0, 0.25));
	}

	/* Gift */
	#gift {
		position: absolute;
		right: -1vw;
		bottom: -12vw;
		height: 68.5vw;
		z-index: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.cb-copy .char {
			transform: none;
		}
	}

	@media (max-width: 743px) {
		.bottom-part {
			height: 210vw;
		}
		.note {
			top: -1vw;
			left: -10vw;
			width: 72vw;
		}
		#tape-on-note {
			top: 10.5vw;
			left: 15vw;
			width: 24vw;
		}
		#paperclip {
			top: 50vw;
			left: 2vw;
			width: 16vw;
			height: auto;
		}
		.hand-note {
			top: 66vw;
			left: 4vw;
			width: 50vw;
		}
		.hand-ink {
			font-size: 3.6vw;
		}
		#lemon {
			width: 80vw;
			bottom: 30vw;
		}
		#tape-on-lemon {
			top: 102vw;
			left: 36vw;
			width: 34vw;
		}
		.cb-wrap {
			top: 4vw;
			width: 46vw;
			height: 92vw;
		}
		.cb-copy {
			top: 10vw;
			left: 5vw;
			max-width: 38vw;
			font-size: 7.4vw;
		}
		#tape-top {
			top: 0;
			width: 54vw;
			height: 11vw;
		}
		#gift {
			height: 100vw;
			bottom: -8vw;
		}
	}
</style>

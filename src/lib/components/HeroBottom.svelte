<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';

	const NOTE_ITEMS = [
		'Interactive Web & UI',
		'GSAP Motion & Micro-UX',
		'SvelteKit & TypeScript'
	];

	const CARDBOARD_WORDS = [
		'CRAFTING',
		'INTERFACES,',
		'BUILDING',
		'FAST',
		'APPS,',
		'MAKING',
		'MOTION',
		'THAT',
		'STICKS.'
	];

	let bottomEl: HTMLElement | null = null;

	onMount(() => {
		const root = bottomEl;
		if (!root) return;

		gsap.registerPlugin(ScrollTrigger);

		const chars = Array.from(root.querySelectorAll<HTMLElement>('.cardboard-copy .char'));
		if (!chars.length) return;

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			gsap.set(chars, { clearProps: 'transform' });
			return;
		}

		const tween = gsap.to(chars, {
			yPercent: 0,
			y: 0,
			duration: 0.75,
			stagger: 0.012,
			ease: 'power3.out',
			scrollTrigger: {
				trigger: root.querySelector('.cardboard-wrapper'),
				start: 'top 80%',
				once: true
			}
		});

		return () => {
			tween.scrollTrigger?.kill();
			tween.kill();
			gsap.set(chars, { clearProps: 'transform' });
		};
	});
</script>

<section class="bottom-part" bind:this={bottomEl}>
	<div class="sticky-note-wrap">
		<img
			class="sticky-note-tape"
			src="/assets/masking-tape-x2.png"
			alt=""
			draggable="false"
		/>
		<div class="sticky-note-card">
			<h3 class="sticky-note-title">THINGS I BUILD</h3>
			<ul class="sticky-note-list">
				{#each NOTE_ITEMS as item (item)}
					<li>
						<span class="sticky-note-dot" aria-hidden="true"></span>
						<span>{item}</span>
					</li>
				{/each}
			</ul>
		</div>
		<img
			class="paperclip-img"
			src="/assets/paper-clip-1.webp"
			alt=""
			draggable="false"
		/>
	</div>

	<div class="cardboard-wrapper">
		<img
			class="cardboard-tape"
			src="/assets/opp-tape-x4.png"
			alt=""
			draggable="false"
		/>
		<img
			class="cardboard-bg"
			src="/assets/cardboard.webp"
			alt=""
			draggable="false"
		/>
		<div class="cardboard-copy">
			<h2 class="h2" aria-label={CARDBOARD_WORDS.join(' ')}>
				{#each CARDBOARD_WORDS as word (word)}
					<span class="word" aria-hidden="true">
						{#each word.split('') as ch, i (i)}
							<span class="clip">
								<span class="char">{ch}</span>
							</span>
						{/each}
					</span>
				{/each}
			</h2>
		</div>
	</div>
</section>

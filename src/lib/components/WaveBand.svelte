<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';

	const PHRASE = 'DESIGNED WITH CARE, \u00A0\u00A0\u00A0 ENGINEERED TO PERFORM \u00A0\u00A0\u2726\u00A0\u00A0 ';
	const REPEATED_TEXT = PHRASE.repeat(8);

	let textPathEl: SVGTextPathElement | null = null;

	onMount(() => {
		if (!textPathEl) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const tween = gsap.fromTo(
			textPathEl,
			{ attr: { startOffset: 0 } },
			{
				attr: { startOffset: -1600 },
				duration: 18,
				ease: 'none',
				repeat: -1
			}
		);

		return () => {
			tween.kill();
		};
	});
</script>

<section class="wave-band" aria-hidden="true">
	<svg viewBox="-80 60 1760 540" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
		<defs>
			<path
				id="wave-band-path"
				d="M -3200,330 Q -2800,460 -2400,330 Q -2000,200 -1600,330 Q -1200,460 -800,330 Q -400,200 0,330 Q 400,460 800,330 Q 1200,200 1600,330 Q 2000,460 2400,330 Q 2800,200 3200,330 Q 3600,460 4000,330 Q 4400,200 4800,330 Q 5200,460 5600,330 Q 6000,200 6400,330 Q 6800,460 7200,330 Q 7600,200 8000,330"
				fill="none"
			/>
			<path
				id="wave-band-bottom-fill"
				d="M -3200,330 Q -2800,460 -2400,330 Q -2000,200 -1600,330 Q -1200,460 -800,330 Q -400,200 0,330 Q 400,460 800,330 Q 1200,200 1600,330 Q 2000,460 2400,330 Q 2800,200 3200,330 L 3200,800 L -3200,800 Z"
			/>
			<pattern
				id="wave-band-grain"
				patternUnits="userSpaceOnUse"
				x="0"
				y="60"
				width="1600"
				height="897"
			>
				<image href="/assets/paper-overlay.webp" width="1600" height="897" />
			</pattern>
		</defs>

		<!-- Orange background below the wave -->
		<use href="#wave-band-bottom-fill" fill="#fa8005" />
		<use href="#wave-band-bottom-fill" fill="url(#wave-band-grain)" opacity="0.16" />

		<!-- Lime-green ribbon -->
		<use href="#wave-band-path" class="band-tape" />
		<text class="band-text" dy="0.34em">
			<textPath bind:this={textPathEl} href="#wave-band-path" startOffset="0">
				{REPEATED_TEXT}
			</textPath>
		</text>
		<use href="#wave-band-path" class="band-tape-grain" />
	</svg>
</section>

<style>
	.wave-band {
		position: relative;
		width: 100%;
		overflow: hidden;
		z-index: 2;
		margin-top: -4vw;
	}

	.wave-band svg {
		width: 100%;
		height: auto;
		display: block;
	}

	.band-tape {
		fill: none;
		stroke: #b6fe00;
		stroke-width: 195;
		stroke-linecap: round;
	}

	.band-tape-grain {
		fill: none;
		stroke: url(#wave-band-grain);
		stroke-width: 195;
		opacity: 0.16;
		pointer-events: none;
	}

	.band-text {
		font-family: var(--font-heading);
		font-size: 96px;
		font-weight: 900;
		fill: #013900;
		letter-spacing: -1px;
		text-transform: uppercase;
	}
</style>

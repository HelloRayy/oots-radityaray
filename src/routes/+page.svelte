<script lang="ts">
	import HeroTop from '#lib/components/HeroTop.svelte';
	import HeroBottom from '#lib/components/HeroBottom.svelte';
	import WaveBand from '#lib/components/WaveBand.svelte';
	import BotShowcase from '#lib/components/BotShowcase.svelte';
</script>

<svelte:head>
	<title>Raditya Rayhan</title>
</svelte:head>

<main id="main" tabindex="-1">
	<HeroTop />
	<HeroBottom />
	<WaveBand />
	<BotShowcase />
	<section class="next-lime-section" aria-label="Next Section"></section>
</main>

<style>
	.next-lime-section {
		position: relative;
		width: 100%;
		min-height: 45vw;
		margin-top: calc(var(--curve-depth) * -1);
		padding-top: var(--curve-depth);
		background: #b6fe00;
		z-index: 1;
		overflow: clip;
	}

	.next-lime-section::before {
		content: '';
		position: absolute;
		inset: 0;
		opacity: 0.2;
		pointer-events: none;
		background-image: url(/assets/paper-overlay.webp);
		background-repeat: repeat-y;
		background-size: 100%;
	}
</style>

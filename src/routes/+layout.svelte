<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import Lenis from 'lenis';
	import '../app.css';
	import Preloader from '#lib/components/Preloader.svelte';
	import { whenRevealed } from '#lib/utils/reveal.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		ScrollTrigger.config({ ignoreMobileResize: true });

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return;
		}

		const lenis = new Lenis({ duration: 1.8 });
		const onTick = (time: number) => lenis.raf(time * 1000);
		gsap.ticker.add(onTick);
		lenis.on('scroll', ScrollTrigger.update);

		let graceCall: gsap.core.Tween | null = null;
		const unsubReveal = whenRevealed(() => {
			graceCall = gsap.delayedCall(2, () => gsap.ticker.lagSmoothing(0));
			ScrollTrigger.refresh();
		});

		return () => {
			unsubReveal();
			graceCall?.kill();
			gsap.ticker.remove(onTick);
			gsap.ticker.lagSmoothing(500, 33);
			lenis.destroy();
		};
	});
</script>

<Preloader />

<button class="menu-tab" type="button" aria-label="Pull Me">
	<span>PULL ME</span>
</button>

{@render children()}

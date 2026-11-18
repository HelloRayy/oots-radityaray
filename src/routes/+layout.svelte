<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import Lenis from 'lenis';
	import '../app.css';
	import Preloader from '#lib/components/Preloader.svelte';
	import { whenRevealed } from '#lib/utils/reveal.ts';
	import {
		DEFAULT_LENIS_TUNE,
		DEFAULT_PAGE2_TUNE,
		liveTune,
		type LenisTune,
		type Page2Tune
	} from '#lib/utils/tunerStore.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	let hudOpen = $state(false);
	let copiedHud = $state(false);
	let lenisCfg = $state<LenisTune>({ ...DEFAULT_LENIS_TUNE });
	let page2Cfg = $state<Page2Tune>({ ...DEFAULT_PAGE2_TUNE });
	let hudStats = $state({ scroll: 0, velocity: 0, progress: 0 });
	let lenisInstance: Lenis | null = null;

	function syncLenis() {
		liveTune.lenis = { ...lenisCfg };
		if (!lenisInstance) return;
		lenisInstance.options.duration = lenisCfg.duration;
		lenisInstance.options.lerp = lenisCfg.lerp;
		lenisInstance.options.wheelMultiplier = lenisCfg.wheelMultiplier;
		lenisInstance.options.touchMultiplier = lenisCfg.touchMultiplier;
	}

	function syncPage2() {
		liveTune.page2 = { ...page2Cfg };
	}

	function resetHud() {
		lenisCfg = { ...DEFAULT_LENIS_TUNE };
		page2Cfg = { ...DEFAULT_PAGE2_TUNE };
		syncLenis();
		syncPage2();
	}

	function copyHudForAI() {
		const text = [
			'Update Lenis & Page 2 motion settings with these exact values:',
			'Lenis:',
			`- duration: ${lenisCfg.duration}`,
			`- lerp: ${lenisCfg.lerp}`,
			`- wheelMultiplier: ${lenisCfg.wheelMultiplier}`,
			`- touchMultiplier: ${lenisCfg.touchMultiplier}`,
			'Sticky Note (Page 2):',
			`- curl: ${page2Cfg.curl}`,
			`- windSpeed: ${page2Cfg.windSpeed}`,
			`- scrollWind: ${page2Cfg.scrollWind}`,
			`- shadowOpacity: ${page2Cfg.shadowOpacity}`
		].join('\n');
		navigator.clipboard?.writeText(text);
		copiedHud = true;
		setTimeout(() => (copiedHud = false), 1500);
	}

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		ScrollTrigger.config({ ignoreMobileResize: true });

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return;
		}

		const lenis = new Lenis({
			duration: lenisCfg.duration,
			lerp: lenisCfg.lerp,
			wheelMultiplier: lenisCfg.wheelMultiplier,
			touchMultiplier: lenisCfg.touchMultiplier
		});
		lenisInstance = lenis;

		const onTick = (time: number) => lenis.raf(time * 1000);
		gsap.ticker.add(onTick);
		lenis.on('scroll', (e: Lenis) => {
			ScrollTrigger.update();
			if (hudOpen) {
				hudStats = {
					scroll: Math.round(e.scroll),
					velocity: Number(e.velocity.toFixed(2)),
					progress: Math.round((e.progress || 0) * 100)
				};
			}
		});

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
			lenisInstance = null;
		};
	});
</script>

<Preloader />

<button class="menu-tab" type="button" aria-label="Pull Me">
	<span>PULL ME</span>
</button>

{@render children()}

<div class="lenis-hud" class:is-collapsed={!hudOpen}>
	<div class="hud-head">
		<button type="button" class="hud-toggle" onclick={() => (hudOpen = !hudOpen)}>
			Lenis HUD {hudOpen ? '[-]' : '[+]'}
		</button>
		{#if hudOpen}
			<div class="hud-actions">
				<button type="button" class="hud-btn" onclick={resetHud}>Reset</button>
				<button type="button" class="hud-btn is-accent" onclick={copyHudForAI}>
					{copiedHud ? 'Copied!' : 'Copy'}
				</button>
			</div>
		{/if}
	</div>

	{#if hudOpen}
		<div class="hud-stats">
			<span>Y: {hudStats.scroll}px</span>
			<span>V: {hudStats.velocity}</span>
			<span>{hudStats.progress}%</span>
		</div>

		<div class="hud-body">
			<label class="hud-row">
				<span>Duration ({lenisCfg.duration.toFixed(2)}s)</span>
				<input type="range" min="0.4" max="3.5" step="0.05" bind:value={lenisCfg.duration} oninput={syncLenis} />
			</label>
			<label class="hud-row">
				<span>Lerp ({lenisCfg.lerp.toFixed(2)})</span>
				<input type="range" min="0.02" max="0.3" step="0.01" bind:value={lenisCfg.lerp} oninput={syncLenis} />
			</label>
			<label class="hud-row">
				<span>Wheel Mult ({lenisCfg.wheelMultiplier.toFixed(2)})</span>
				<input type="range" min="0.4" max="2.5" step="0.05" bind:value={lenisCfg.wheelMultiplier} oninput={syncLenis} />
			</label>
			<label class="hud-row">
				<span>Note Curl ({page2Cfg.curl.toFixed(2)})</span>
				<input type="range" min="0.02" max="0.32" step="0.01" bind:value={page2Cfg.curl} oninput={syncPage2} />
			</label>
			<label class="hud-row">
				<span>Wind Speed ({page2Cfg.windSpeed.toFixed(2)})</span>
				<input type="range" min="0" max="2.5" step="0.05" bind:value={page2Cfg.windSpeed} oninput={syncPage2} />
			</label>
			<label class="hud-row">
				<span>Scroll Wind ({page2Cfg.scrollWind.toFixed(2)})</span>
				<input type="range" min="0" max="2.5" step="0.05" bind:value={page2Cfg.scrollWind} oninput={syncPage2} />
			</label>
			<label class="hud-row">
				<span>Shadow Opacity ({page2Cfg.shadowOpacity.toFixed(2)})</span>
				<input type="range" min="0.05" max="0.5" step="0.01" bind:value={page2Cfg.shadowOpacity} oninput={syncPage2} />
			</label>
		</div>
	{/if}
</div>

<style>
	.lenis-hud {
		position: fixed;
		right: 16px;
		bottom: 16px;
		z-index: 95;
		width: 248px;
		background: rgba(1, 41, 0, 0.94);
		color: #f4fbe8;
		border: 1px solid rgba(182, 254, 0, 0.45);
		border-radius: 10px;
		padding: 10px 12px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 11px;
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
	}

	.lenis-hud.is-collapsed {
		width: auto;
	}

	.hud-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.hud-toggle {
		background: none;
		border: none;
		color: #b6fe00;
		font-weight: 700;
		cursor: pointer;
		padding: 0;
		font-size: 12px;
	}

	.hud-actions {
		display: flex;
		gap: 6px;
	}

	.hud-btn {
		border: none;
		border-radius: 6px;
		padding: 4px 8px;
		font-size: 11px;
		font-weight: 700;
		cursor: pointer;
		background: rgba(255, 255, 255, 0.14);
		color: #fff;
	}

	.hud-btn.is-accent {
		background: #b6fe00;
		color: #013900;
	}

	.hud-stats {
		display: flex;
		justify-content: space-between;
		margin-top: 8px;
		padding: 4px 6px;
		background: rgba(0, 0, 0, 0.28);
		border-radius: 5px;
		color: #b6fe00;
		font-size: 10px;
	}

	.hud-body {
		margin-top: 8px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.hud-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 10.5px;
	}

	.hud-row input[type='range'] {
		width: 100%;
		accent-color: #b6fe00;
		cursor: pointer;
	}
</style>

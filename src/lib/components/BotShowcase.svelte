<script lang="ts">
	import gsap from 'gsap';
	import museHi from '#lib/assets/muse-hi.svg';
	import designerImg from '#lib/assets/bot-avatars-all/Designer.png';
	import engineerImg from '#lib/assets/bot-avatars-all/Engineer.png';
	import pmImg from '#lib/assets/bot-avatars-all/PM.png';
	import strategyImg from '#lib/assets/bot-avatars-all/Strategy.png';
	import researchImg from '#lib/assets/bot-avatars-all/Research.png';
	import ideasImg from '#lib/assets/bot-avatars-all/Ideas.png';

	interface BotItem {
		id: string;
		name: string;
		roleWord: string;
		avatar: string;
		bg: string;
		word: string;
		tagBg: string;
		tagInk: string;
		ring: string;
		tags: string[];
		copy: string;
	}

	const BOTS: BotItem[] = [
		{
			id: 'designer',
			name: 'Designer',
			roleWord: 'DESIGNER',
			avatar: designerImg,
			bg: '#fa8005',
			word: '#fcd805',
			tagBg: '#FFDC13',
			tagInk: '#D7791A',
			ring: '#fff1a2',
			tags: ['UI / UX', 'ART DIRECTION', 'PROTOTYPING'],
			copy: 'Always ready for crisp layouts, playful micro-interactions, and bold visual systems. Easygoing. Pixel-sharp.'
		},
		{
			id: 'engineer',
			name: 'Engineer',
			roleWord: 'ENGINEER',
			avatar: engineerImg,
			bg: '#50CBFF',
			word: '#007db2',
			tagBg: '#1b87b8',
			tagInk: '#8bd8f5',
			ring: '#a8dcf0',
			tags: ['SVELTEKIT', 'TYPESCRIPT', 'GSAP MOTION'],
			copy: 'The kind of builder that commits. Fast performance, clean architecture, smooth 60fps animations.'
		},
		{
			id: 'pm',
			name: 'PM',
			roleWord: 'MANAGER',
			avatar: pmImg,
			bg: '#FF7B5F',
			word: '#a82712',
			tagBg: '#9e2a12',
			tagInk: '#f2a08c',
			ring: '#ffd9c2',
			tags: ['ROADMAPS', 'SPRINTS', 'SHIPPING'],
			copy: 'From rough ideas to launched products. Keeps scope tight, momentum high, and deadlines met.'
		},
		{
			id: 'strategy',
			name: 'Strategy',
			roleWord: 'STRATEGIST',
			avatar: strategyImg,
			bg: '#2E3EAC',
			word: '#101E83',
			tagBg: '#172795',
			tagInk: '#B0B9FA',
			ring: '#d9d2f7',
			tags: ['POSITIONING', 'GROWTH', 'SYSTEMS'],
			copy: 'Doesn’t talk much. Just connects the dots between user needs and product goals.'
		},
		{
			id: 'research',
			name: 'Research',
			roleWord: 'RESEARCHER',
			avatar: researchImg,
			bg: '#b6fe00',
			word: '#52AF16',
			tagBg: '#52AF16',
			tagInk: '#E7FF8F',
			ring: '#e4f7a8',
			tags: ['USER INSIGHTS', 'AUDITS', 'BENCHMARKS'],
			copy: 'Digs deep into patterns, edge cases, and usability so every decision is backed by real signal.'
		},
		{
			id: 'ideas',
			name: 'Ideas',
			roleWord: 'CREATIVE',
			avatar: ideasImg,
			bg: '#F7D000',
			word: '#a88700',
			tagBg: '#a88700',
			tagInk: '#ffeda0',
			ring: '#fff0b0',
			tags: ['CONCEPTS', 'EXPERIMENTS', 'PLAYFUL'],
			copy: 'Perfect for wild prototypes, late-night brainstorms, and fresh interactive concepts.'
		}
	];

	let activeIndex = $state(0);
	let active = $derived(BOTS[activeIndex]);
	let centerEl: HTMLElement | null = null;
	let copyEl: HTMLElement | null = null;

	function selectBot(idx: number) {
		if (idx === activeIndex) return;
		activeIndex = idx;

		if (centerEl) {
			gsap.fromTo(
				centerEl,
				{ scale: 0.9, y: 18 },
				{ scale: 1, y: 0, duration: 0.55, ease: 'back.out(1.6)', overwrite: 'auto' }
			);
		}
		if (copyEl) {
			gsap.fromTo(
				copyEl,
				{ y: 14, opacity: 0 },
				{ y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' }
			);
		}
	}
</script>

<section
	class="bot-showcase"
	style:--bg={active.bg}
	style:--word={active.word}
	style:--tag-bg={active.tagBg}
	style:--tag-ink={active.tagInk}
>
	<div class="paper-grain" aria-hidden="true"></div>

	<div class="subhead-wrap">
		<span class="subhead-pill">
			<span class="subhead-dots" aria-hidden="true"></span>
			MEET THE AI SQUAD
		</span>
	</div>

	<div class="stage">
		<!-- Left: tags + copy -->
		<div class="left" bind:this={copyEl}>
			<div class="tags">
				{#each active.tags as tag (tag)}
					<span class="tag">{tag}</span>
				{/each}
			</div>
			<p class="copy">{active.copy}</p>
		</div>

		<!-- Center: Giant role typography + Muse + Explore stamp -->
		<div class="center" bind:this={centerEl}>
			<div class="giant-word" aria-hidden="true">
				<span class="the">THE</span>
				<span class="role">{active.roleWord}</span>
			</div>

			<img class="muse-center" src={museHi} alt={active.name} draggable="false" />

			<div class="explore-stamp" aria-hidden="true">
				<span class="explore-ring"></span>
				<span class="explore-text">EXPLORE</span>
				<span class="explore-dot">↗</span>
			</div>
		</div>

		<!-- Right: Roll It rail of bot avatars -->
		<div class="rail">
			<span class="roll-it" aria-hidden="true">ROLL IT!</span>
			<div class="rail-track">
				{#each BOTS as bot, i (bot.id)}
					<button
						type="button"
						class="rail-btn"
						class:is-active={i === activeIndex}
						style:--ring={bot.ring}
						aria-label={bot.name}
						onclick={() => selectBot(i)}
					>
						<img src={bot.avatar} alt={bot.name} draggable="false" />
					</button>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.bot-showcase {
		position: relative;
		width: 100%;
		min-height: 56vw;
		background: var(--bg);
		transition: background-color 0.55s cubic-bezier(0.22, 1, 0.36, 1);
		padding: 3vw 3vw 6vw;
		overflow: clip;
		z-index: 1;
	}

	.paper-grain {
		position: absolute;
		inset: 0;
		opacity: 0.16;
		pointer-events: none;
		background-image: url(/assets/paper-overlay.webp);
		background-repeat: repeat-y;
		background-size: 100%;
	}

	.subhead-wrap {
		position: relative;
		z-index: 2;
		display: flex;
		justify-content: center;
		margin-bottom: 1.5vw;
	}

	.subhead-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.5vw;
		padding: 0.45vw 1vw;
		border-radius: 0.35vw;
		background: var(--tag-bg);
		color: var(--tag-ink);
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.05vw;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		transition: background-color 0.45s ease, color 0.45s ease;
	}

	.subhead-dots {
		width: 0.22vw;
		height: 0.9vw;
		background-image: radial-gradient(circle, currentColor 45%, transparent 50%);
		background-size: 100% 0.3vw;
	}

	.stage {
		position: relative;
		z-index: 2;
		display: grid;
		grid-template-columns: 20vw 1fr 18vw;
		align-items: center;
		min-height: 44vw;
	}

	/* Left */
	.left {
		display: flex;
		flex-direction: column;
		gap: 2.2vw;
	}

	.tags {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5vw;
	}

	.tag {
		display: inline-block;
		padding: 0.4vw 0.9vw;
		border-radius: 0.3vw;
		background: var(--tag-bg);
		color: var(--tag-ink);
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.15vw;
		letter-spacing: -0.01em;
		text-transform: uppercase;
		transition: background-color 0.45s ease, color 0.45s ease;
	}

	.copy {
		font-family: var(--font-body);
		font-size: 1.1vw;
		font-weight: 600;
		line-height: 1.3;
		color: var(--word);
		max-width: 17vw;
		transition: color 0.45s ease;
	}

	/* Center */
	.center {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 42vw;
	}

	.giant-word {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-family: var(--font-heading);
		font-weight: 900;
		color: var(--word);
		line-height: 0.78;
		text-transform: uppercase;
		pointer-events: none;
		user-select: none;
		transition: color 0.45s ease;
	}

	.giant-word .the {
		font-size: 13vw;
		letter-spacing: -0.02em;
	}

	.giant-word .role {
		font-size: 15vw;
		letter-spacing: -0.02em;
	}

	.muse-center {
		position: relative;
		z-index: 2;
		width: 24vw;
		height: auto;
		pointer-events: none;
		filter: drop-shadow(0 1.4vw 2.4vw rgba(0, 0, 0, 0.25));
	}

	.explore-stamp {
		position: absolute;
		top: 6vw;
		right: 11vw;
		z-index: 3;
		width: 9.5vw;
		height: 9.5vw;
		border-radius: 999px;
		background: #ffffff;
		color: #013900;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: 0 0.8vw 1.8vw rgba(0, 0, 0, 0.2);
		transform: rotate(8deg);
	}

	.explore-ring {
		position: absolute;
		inset: 0.55vw;
		border-radius: 999px;
		border: 2px dotted #013900;
	}

	.explore-text {
		font-family: var(--font-heading);
		font-weight: 900;
		font-size: 2vw;
		line-height: 1;
	}

	.explore-dot {
		margin-top: 0.2vw;
		width: 1.6vw;
		height: 1.6vw;
		border-radius: 999px;
		background: #b6fe00;
		display: grid;
		place-items: center;
		font-size: 0.9vw;
		font-weight: 900;
	}

	/* Right Rail */
	.rail {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.8vw;
		padding-right: 1vw;
	}

	.roll-it {
		font-family: var(--font-heading);
		font-weight: 900;
		font-size: 1.25vw;
		color: var(--word);
		letter-spacing: 0.02em;
		transform: rotate(-8deg);
		transition: color 0.45s ease;
	}

	.rail-track {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.9vw;
	}

	.rail-btn {
		position: relative;
		width: 6.2vw;
		height: 6.2vw;
		border-radius: 999px;
		padding: 0.35vw;
		background: rgba(255, 255, 255, 0.18);
		border: 2px solid transparent;
		transition:
			transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
			border-color 0.3s ease,
			background-color 0.3s ease;
	}

	.rail-btn:hover {
		transform: scale(1.08);
	}

	.rail-btn.is-active {
		transform: scale(1.14);
		border-color: var(--ring);
		background: var(--ring);
		box-shadow: 0 0.6vw 1.4vw rgba(0, 0, 0, 0.22);
	}

	.rail-btn img {
		width: 100%;
		height: 100%;
		border-radius: 999px;
		object-fit: cover;
	}

	@media (max-width: 743px) {
		.bot-showcase {
			min-height: 145vw;
			padding: 8vw 4vw 12vw;
		}
		.subhead-pill {
			font-size: 3.2vw;
			padding: 1.4vw 3vw;
		}
		.stage {
			grid-template-columns: 1fr;
			gap: 6vw;
		}
		.left {
			order: 3;
		}
		.copy {
			font-size: 3.5vw;
			max-width: 100%;
		}
		.tag {
			font-size: 3.4vw;
			padding: 1.2vw 2.8vw;
		}
		.center {
			order: 1;
			height: 75vw;
		}
		.giant-word .the {
			font-size: 24vw;
		}
		.giant-word .role {
			font-size: 22vw;
		}
		.muse-center {
			width: 48vw;
		}
		.explore-stamp {
			width: 22vw;
			height: 22vw;
			top: 4vw;
			right: 4vw;
		}
		.explore-text {
			font-size: 4.5vw;
		}
		.rail {
			order: 2;
			align-items: center;
			padding-right: 0;
		}
		.roll-it {
			font-size: 3.8vw;
		}
		.rail-track {
			grid-template-columns: repeat(6, 1fr);
			gap: 2vw;
		}
		.rail-btn {
			width: 13vw;
			height: 13vw;
		}
	}
</style>

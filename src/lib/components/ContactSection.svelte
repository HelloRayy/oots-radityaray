<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { mountContactStickyNote } from '#lib/utils/stickyNote.ts';

	const EMAIL_LABEL = 'HELLO@RADITYARAY.COM';
	const PHONE_LABEL = '+62 812 3456 7890';

	let sectionEl: HTMLElement | null = null;
	let noteEl: HTMLElement | null = null;
	let sendLabel = $state('SEND');
	let sending = $state(false);
	let notice = $state<{ type: 'success' | 'error'; title: string; detail: string } | null>(null);

	function shuffle<T>(arr: T[]): T[] {
		const copy = [...arr];
		for (let i = copy.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[copy[i], copy[j]] = [copy[j], copy[i]];
		}
		return copy;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (sending) return;
		const form = e.currentTarget as HTMLFormElement;
		const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

		if (!data.email?.trim()) {
			sendLabel = 'ADD AN EMAIL FIRST';
			notice = {
				type: 'error',
				title: 'EMAIL REQUIRED',
				detail: 'Isi alamat email dulu supaya bisa dibalas.'
			};
			return;
		}
		if (!data.message?.trim()) {
			sendLabel = 'WRITE A MESSAGE FIRST';
			notice = {
				type: 'error',
				title: 'MESSAGE EMPTY',
				detail: 'Tulis pesan singkat dulu sebelum mengirim.'
			};
			return;
		}

		sending = true;
		sendLabel = 'SENDING…';
		notice = null;

		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || !result.ok) {
				throw new Error(result?.error || `Error ${res.status}`);
			}
			form.reset();
			sendLabel = 'SENT';
			notice = {
				type: 'success',
				title: 'MESSAGE SENT',
				detail: 'Pesan lo sudah masuk ke inbox. Gua akan balas secepatnya.'
			};
		} catch (err) {
			sendLabel = 'TRY AGAIN';
			notice = {
				type: 'error',
				title: 'FAILED TO SEND',
				detail: err instanceof Error ? err.message : 'Gagal mengirim pesan. Coba lagi.'
			};
		} finally {
			sending = false;
		}
	}

	onMount(() => {
		const root = sectionEl;
		if (!root) return;

		gsap.registerPlugin(ScrollTrigger);

		let cleanupNote: (() => void) | null = null;
		if (noteEl) {
			cleanupNote = mountContactStickyNote(noteEl, EMAIL_LABEL, PHONE_LABEL, 0.5);
		}

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return () => cleanupNote?.();
		}

		const titleChars = gsap.utils.toArray<HTMLElement>('.contact-title .char', root);
		const sheetChars = gsap.utils.toArray<HTMLElement>('.contact-sheet-head .char', root);
		const chip = root.querySelector<HTMLElement>('.contact-chip');
		const sheet = root.querySelector<HTMLElement>('.contact-sheet');

		const tweens: gsap.core.Tween[] = [];

		const st = ScrollTrigger.create({
			trigger: root,
			start: 'top 78%',
			once: true,
			onEnter: () => {
				if (chip) {
					tweens.push(
						gsap.from(chip, {
							autoAlpha: 0,
							rotateY: -90,
							transformPerspective: 800,
							transformOrigin: '50% 50%',
							duration: 0.65,
							ease: 'back.out(1.6)'
						})
					);
				}
				if (titleChars.length) {
					tweens.push(
						gsap.from(shuffle(titleChars), {
							yPercent: 115,
							duration: 0.7,
							stagger: 0.02,
							ease: 'power3.out'
						})
					);
				}
				if (sheet) {
					tweens.push(
						gsap.from(sheet, {
							autoAlpha: 0,
							yPercent: 6,
							duration: 0.62,
							delay: 0.18,
							ease: 'power2.out'
						})
					);
				}
				if (sheetChars.length) {
					tweens.push(
						gsap.from(shuffle(sheetChars), {
							yPercent: 115,
							duration: 0.65,
							stagger: 0.016,
							delay: 0.32,
							ease: 'power3.out'
						})
					);
				}
			}
		});

		return () => {
			st.kill();
			tweens.forEach((t) => t.kill());
			cleanupNote?.();
		};
	});
</script>

<section bind:this={sectionEl} class="contact-section" aria-label="Contact">
	<header class="contact-head">
		<p class="subhead contact-chip">
			<span class="chip-dots" aria-hidden="true"></span>
			<span>GET IN TOUCH</span>
		</p>
		<h1 class="contact-title" aria-label="LET’S STICK TOGETHER">
			<span class="line" aria-hidden="true" style="--letters:11">
				{#each 'LET’S\u00A0STICK'.split('') as ch, i}
					<span class="clip" style="--i:{i}"><span class="char">{ch}</span></span>
				{/each}
			</span>
			<span class="line" aria-hidden="true" style="--letters:8">
				{#each 'TOGETHER'.split('') as ch, i}
					<span class="clip" style="--i:{i}"><span class="char">{ch}</span></span>
				{/each}
			</span>
		</h1>
	</header>

	<div class="contact-sheet">
		<h2 class="contact-sheet-head" aria-label="DROP US A MESSAGE">
			<span class="line" aria-hidden="true">
				{#each 'DROP\u00A0US\u00A0A'.split('') as ch, i}
					<span class="clip" style="--i:{i}"><span class="char">{ch}</span></span>
				{/each}
			</span>
			<span class="line" aria-hidden="true">
				{#each 'MESSAGE'.split('') as ch, i}
					<span class="clip" style="--i:{i}"><span class="char">{ch}</span></span>
				{/each}
			</span>
		</h2>

		<form class="contact-form" novalidate onsubmit={handleSubmit}>
			<div class="contact-fields">
				<p class="contact-field">
					<label class="sr-only" for="contact-name">NAME</label>
					<input
						class="contact-input"
						id="contact-name"
						type="text"
						placeholder="NAME"
						autocomplete="name"
						name="name"
					/>
				</p>
				<p class="contact-field">
					<label class="sr-only" for="contact-company">COMPANY</label>
					<input
						class="contact-input"
						id="contact-company"
						type="text"
						placeholder="COMPANY"
						autocomplete="organization"
						name="company"
					/>
				</p>
				<p class="contact-field">
					<label class="sr-only" for="contact-phone">PHONE NUMBER</label>
					<input
						class="contact-input"
						id="contact-phone"
						type="tel"
						placeholder="PHONE NUMBER"
						autocomplete="tel"
						name="phone"
					/>
				</p>
				<p class="contact-field">
					<label class="sr-only" for="contact-email">EMAIL</label>
					<input
						class="contact-input"
						id="contact-email"
						type="email"
						placeholder="EMAIL"
						autocomplete="email"
						name="email"
					/>
				</p>
				<p class="contact-field contact-field--message">
					<label class="sr-only" for="contact-message">MESSAGE</label>
					<textarea
						class="contact-input contact-textarea"
						id="contact-message"
						name="message"
						placeholder="MESSAGE"
						rows="4"
					></textarea>
				</p>
			</div>
			<button class="contact-send" type="submit" disabled={sending} aria-live="polite">
				{sendLabel}
			</button>
		</form>

		{#if notice}
			<div class="contact-notice" data-type={notice.type} role="status" aria-live="polite">
				<span class="contact-notice-badge">
					<span class="notice-dots" aria-hidden="true"></span>
					<span>{notice.title}</span>
				</span>
				<p class="contact-notice-text">{notice.detail}</p>
				<button
					class="contact-notice-close"
					type="button"
					aria-label="Dismiss notification"
					onclick={() => (notice = null)}
				>
					×
				</button>
			</div>
		{/if}
	</div>

	<div class="contact-note" aria-hidden="true">
		<div bind:this={noteEl} class="sticky-note"></div>
		<img class="contact-note-tape" src="/assets/masking-tape-x2.png" alt="" draggable="false" />
	</div>

	<p class="sr-only">
		<a href="mailto:{EMAIL_LABEL.toLowerCase()}">{EMAIL_LABEL}</a>
		<a href="tel:{PHONE_LABEL.replace(/\s+/g, '')}">{PHONE_LABEL}</a>
	</p>
</section>

<style>
	.contact-section {
		--contact-bg: #50cbff;
		--contact-ink: #013900;
		--contact-paper: #fdfbe8;
		--contact-paper-ink: #0d470c;
		--contact-field-bg: #ebe4c6;
		--contact-field-ink: #7b5406;
		--contact-perf: #50cbff;
		--contact-pad-top: calc(var(--curve-depth) + 4vw);
		--contact-gap: 3.194vw;
		--contact-sheet-w: 74.722vw;
		--contact-sheet-pad-x: 7.431vw;
		--contact-sheet-pad-top: 5.908vw;
		--contact-head-gap: 2.35vw;
		--contact-field-h: 5.903vw;
		--contact-row-gap: 1.111vw;
		--contact-col-gap: 1.25vw;
		--contact-msg-h: 10.833vw;
		--contact-send-w: 15.069vw;
		--contact-send-gap: 2.569vw;
		--contact-title-size: 13.194vw;
		--arc-drop: 1.778vw;
		--arc-tilt: 7deg;
		--contact-arc: var(--curve-depth);
		--contact-overlap: 4vw;
		width: 100%;
		margin-top: calc(var(--contact-arc) * -1);
		padding: var(--contact-pad-top) 0 calc(var(--contact-arc) + 6vw);
		background: var(--contact-bg);
		color: var(--contact-ink);
		-webkit-mask-image: linear-gradient(#000 0 0), var(--section-bite);
		mask-image: linear-gradient(#000 0 0), var(--section-bite);
		-webkit-mask-size:
			100% calc(100% - var(--contact-arc) + 1px),
			100% var(--contact-arc);
		mask-size:
			100% calc(100% - var(--contact-arc) + 1px),
			100% var(--contact-arc);
		-webkit-mask-position:
			0 100%,
			0 0;
		mask-position:
			0 100%,
			0 0;
		-webkit-mask-repeat: no-repeat, no-repeat;
		mask-repeat: no-repeat, no-repeat;
		position: relative;
		overflow-x: clip;
		z-index: 12;
	}

	.contact-section::before {
		content: '';
		opacity: 0.25;
		pointer-events: none;
		background-image: url(/assets/paper-overlay.webp);
		background-repeat: repeat-y;
		background-size: 100%;
		position: absolute;
		inset: 0;
	}

	.contact-head {
		text-align: center;
		position: relative;
		z-index: 2;
	}

	.contact-chip {
		background: var(--contact-ink);
		color: var(--contact-bg);
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.04vw;
		line-height: 1;
		letter-spacing: 0.04em;
		padding: 0.55vw 1.15vw 0.55vw 1.45vw;
		border-radius: 0.28vw;
		margin: 0;
		display: inline-flex;
		align-items: center;
		gap: 0.45vw;
		transform: rotate(-1.8deg);
		position: relative;
	}

	.chip-dots {
		width: 0.18vw;
		height: 0.9vw;
		background-image: radial-gradient(circle, currentColor 42%, transparent 45%);
		background-repeat: repeat-y;
		background-size: 100% 0.3vw;
		position: absolute;
		left: 0.5vw;
		top: 50%;
		transform: translateY(-50%);
	}

	.contact-title {
		font-family: var(--font-heading);
		font-size: var(--contact-title-size);
		letter-spacing: -0.24vw;
		margin: 0.7vw 0 0;
		font-weight: 800;
		line-height: 0.8265;
	}

	.contact-title .line .clip {
		--u: calc(2 * var(--i) / (var(--letters) - 1) - 1);
		transform-origin: 50% 100%;
		transform: translate(
				var(--dx, 0px),
				calc(var(--arc-drop) * (1 - var(--u) * var(--u)) + var(--dy, 0px))
			)
			rotate(calc(var(--arc-tilt) * var(--u) * -1 + var(--dr, 0deg)));
	}

	.contact-title .line,
	.contact-sheet-head .line {
		align-items: flex-end;
		display: flex;
	}

	.contact-title .line {
		justify-content: center;
	}

	.contact-section .clip {
		flex: none;
		margin: -0.2em -0.06em 0;
		padding: 0.2em 0.06em 0;
		display: block;
		overflow: hidden;
	}

	.contact-section .char {
		display: block;
		cursor: default;
	}

	.contact-sheet {
		z-index: 20;
		width: var(--contact-sheet-w);
		margin: var(--contact-gap) auto 0;
		padding: var(--contact-sheet-pad-top) var(--contact-sheet-pad-x) 7.014vw;
		background: var(--contact-paper);
		color: var(--contact-paper-ink);
		border-radius: 3.194vw;
		position: relative;
		box-shadow: 0 1.6vw 3.4vw rgba(1, 57, 0, 0.14);
	}

	.contact-sheet::before {
		content: '';
		background-image: radial-gradient(circle closest-side, var(--contact-perf) 96%, transparent);
		pointer-events: none;
		background-repeat: repeat-x;
		background-size: 1.327vw 100%;
		height: 0.556vw;
		position: absolute;
		top: 0.972vw;
		left: 1.944vw;
		right: 1.944vw;
	}

	.contact-sheet-head {
		margin: 0 0 var(--contact-head-gap);
		font-family: var(--font-heading);
		letter-spacing: -0.05vw;
		font-size: 2.5vw;
		font-weight: 800;
		line-height: 0.92;
	}

	.contact-sheet-head .line {
		justify-content: flex-start;
	}

	.contact-form {
		align-items: stretch;
		gap: var(--contact-send-gap);
		display: flex;
	}

	.contact-fields {
		gap: var(--contact-row-gap) var(--contact-col-gap);
		flex: 1;
		grid-template-columns: 1fr 1fr;
		min-width: 0;
		display: grid;
	}

	.contact-field {
		margin: 0;
	}

	.contact-field--message {
		grid-column: 1 / -1;
	}

	.contact-input {
		width: 100%;
		height: var(--contact-field-h);
		background: var(--contact-field-bg);
		color: var(--contact-field-ink);
		font-family: var(--font-body);
		letter-spacing: 0;
		border: 0;
		border-radius: 1.528vw;
		padding: 0 1.667vw;
		font-size: max(16px, 1.111vw);
		font-weight: 600;
		display: block;
	}

	.contact-input::placeholder {
		color: currentColor;
		opacity: 0.55;
		font-family: var(--font-heading);
		letter-spacing: 0.02em;
		font-weight: 700;
	}

	.contact-textarea {
		height: var(--contact-msg-h);
		resize: vertical;
		padding: 1.667vw;
		line-height: 1.4;
	}

	.contact-send {
		white-space: pre-line;
		width: var(--contact-send-w);
		background: var(--contact-bg);
		color: var(--contact-ink);
		line-height: 0.95;
		font-family: var(--font-heading);
		letter-spacing: 0.02em;
		cursor: pointer;
		border: 0;
		border-radius: 2.778vw;
		flex: none;
		font-size: 1.944vw;
		font-weight: 800;
		transition:
			background 0.3s,
			color 0.3s;
	}

	.contact-send:hover,
	.contact-send:focus-visible {
		background: var(--contact-ink);
		color: var(--contact-bg);
	}

	.contact-input:focus-visible,
	.contact-send:focus-visible {
		outline: 0.14vw solid var(--contact-paper-ink);
		outline-offset: 0.2vw;
	}

	.contact-notice {
		margin-top: 1.6vw;
		padding: 1.15vw 1.5vw;
		border-radius: 1.528vw;
		display: flex;
		align-items: center;
		gap: 1.1vw;
		background: #ebe4c6;
		color: #013900;
		border: 2px solid #013900;
	}

	.contact-notice[data-type='success'] {
		background: #b6fe00;
		color: #013900;
		border-color: #013900;
	}

	.contact-notice[data-type='error'] {
		background: #ff7b5f;
		color: #2b0600;
		border-color: #2b0600;
	}

	.contact-notice-badge {
		position: relative;
		flex: none;
		display: inline-flex;
		align-items: center;
		padding: 0.45vw 0.9vw 0.45vw 1.25vw;
		border-radius: 0.35vw;
		background: currentColor;
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: max(12px, 0.95vw);
		line-height: 1;
		letter-spacing: 0.04em;
	}

	.contact-notice-badge > span:last-child {
		color: #fdfbe8;
	}

	.contact-notice[data-type='success'] .contact-notice-badge > span:last-child {
		color: #b6fe00;
	}

	.notice-dots {
		width: 0.18vw;
		height: 0.85vw;
		background-image: radial-gradient(circle, #fdfbe8 42%, transparent 45%);
		background-repeat: repeat-y;
		background-size: 100% 0.28vw;
		position: absolute;
		left: 0.45vw;
		top: 50%;
		transform: translateY(-50%);
	}

	.contact-notice-text {
		margin: 0;
		flex: 1;
		font-family: var(--font-body);
		font-size: max(13px, 1vw);
		font-weight: 600;
		line-height: 1.35;
	}

	.contact-notice-close {
		flex: none;
		width: 2vw;
		height: 2vw;
		min-width: 28px;
		min-height: 28px;
		border-radius: 999px;
		border: 0;
		background: rgba(0, 0, 0, 0.1);
		color: inherit;
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		display: grid;
		place-items: center;
	}

	.contact-note {
		z-index: 21;
		--note-tilt: -4deg;
		width: 43.5vw;
		rotate: var(--note-tilt);
		pointer-events: none;
		position: absolute;
		top: 19.5vw;
		left: 60.1vw;
	}

	.contact-note .sticky-note {
		aspect-ratio: 1 / 0.94;
		width: 100%;
	}

	.contact-note .sticky-note :global(canvas) {
		width: 100%;
		height: 100%;
		rotate: calc(var(--note-tilt) * -1);
		display: block;
	}

	.contact-note-tape {
		width: 29.5%;
		position: absolute;
		top: 13.4%;
		left: 34.5%;
		rotate: -8deg;
		filter: drop-shadow(0 0.35vw 0.55vw rgba(0, 0, 0, 0.24));
	}

	.sr-only {
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		position: absolute;
		overflow: hidden;
	}

	@media (max-width: 743px) {
		.contact-section {
			--contact-pad-top: 14vw;
			--contact-gap: 8vw;
			--contact-sheet-w: 90vw;
			--contact-sheet-pad-x: 7vw;
			--contact-sheet-pad-top: 9vw;
			--contact-head-gap: 8vw;
			--contact-field-h: 12vw;
			--contact-row-gap: 3.2vw;
			--contact-msg-h: 30vw;
			--contact-send-gap: 4vw;
			--contact-title-size: 17vw;
			--arc-drop: 2.3vw;
		}
		.contact-chip {
			font-size: 3.4vw;
			padding: 1.6vw 3.2vw 1.6vw 4.2vw;
			border-radius: 1vw;
		}
		.contact-title {
			letter-spacing: -0.5vw;
			margin-top: 2vw;
		}
		.contact-sheet {
			border-radius: 6vw;
			padding-bottom: 13vw;
		}
		.contact-sheet::before {
			background-size: 3vw 100%;
			height: 1.4vw;
			top: 2.6vw;
			left: 5vw;
			right: 5vw;
		}
		.contact-sheet-head {
			letter-spacing: -0.16vw;
			font-size: 8vw;
		}
		.contact-form {
			flex-direction: column;
		}
		.contact-fields {
			grid-template-columns: 1fr;
		}
		.contact-input {
			border-radius: 3.5vw;
			padding: 0 4.5vw;
			font-size: max(16px, 4.2vw);
		}
		.contact-textarea {
			padding: 4.5vw;
		}
		.contact-send {
			white-space: normal;
			border-radius: 7vw;
			width: 100%;
			height: 14vw;
			font-size: 5.6vw;
		}
		.contact-note {
			width: 62vw;
			top: 46vw;
			left: 47.8vw;
		}
	}
</style>

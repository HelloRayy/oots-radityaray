import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
	const toEmail = env.RESEND_TO_EMAIL || process.env.RESEND_TO_EMAIL || 'sigmaperson2828@gmail.com';

	if (!apiKey) {
		return json({ ok: false, error: 'RESEND_API_KEY belum dikonfigurasi.' }, { status: 500 });
	}

	let body: Record<string, string>;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Format request tidak valid.' }, { status: 400 });
	}

	const name = (body.name ?? '').trim();
	const company = (body.company ?? '').trim();
	const phone = (body.phone ?? '').trim();
	const email = (body.email ?? '').trim();
	const message = (body.message ?? '').trim();

	if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return json({ ok: false, error: 'Masukkan alamat email yang valid.' }, { status: 400 });
	}
	if (!message) {
		return json({ ok: false, error: 'Pesan tidak boleh kosong.' }, { status: 400 });
	}

	const subject = `New Message from ${name || email}${company ? ` (${company})` : ''}`;
	const text = [
		`Name: ${name || '-'}`,
		`Company: ${company || '-'}`,
		`Phone: ${phone || '-'}`,
		`Email: ${email}`,
		'',
		'Message:',
		message
	].join('\n');

	try {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: 'Portfolio Contact <onboarding@resend.dev>',
				to: [toEmail],
				reply_to: email,
				subject,
				text
			})
		});

		if (!res.ok) {
			const errData = await res.json().catch(() => ({}));
			return json(
				{ ok: false, error: errData?.message || `Resend error (${res.status})` },
				{ status: res.status }
			);
		}

		return json({ ok: true });
	} catch {
		return json({ ok: false, error: 'Gagal menghubungi server Resend.' }, { status: 502 });
	}
};

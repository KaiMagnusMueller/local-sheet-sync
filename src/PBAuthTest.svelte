<script>
	import PocketBase, { BaseAuthStore } from 'pocketbase';
	import { sendMsgToFigma } from './lib/helper-functions';
	import { Icon, IconSpinner } from 'figma-plugin-ds-svelte';

	/**
	 * The default token store for browsers with auto fallback
	 * to runtime/memory if local storage is undefined (eg. in node env).
	 */
	export class FigmaAuthStore extends BaseAuthStore {
		constructor(storageKey = 'pocketbase_auth') {
			super();

			this.storageFallback = {};
			this.storageKey = storageKey;

			// this._bindStorageEvent();
		}

		get token() {
			const data = this._storageGet(this.storageKey) || {};
			return data.token || '';
		}

		get model() {
			const data = this._storageGet(this.storageKey) || {};
			return data.model || null;
		}

		save(token, model) {
			this._storageSet(this.storageKey, {
				token: token,
				model: model,
			});

			user = model;
			super.save(token, model);
		}

		clear() {
			this._storageRemove(this.storageKey);

			user = null;
			super.clear();
		}

		_storageGet(key) {
			const rawValue = pbAuthToken || '';
			try {
				return JSON.parse(rawValue);
			} catch (e) {
				return rawValue;
			}
		}

		_storageSet(key, value) {
			let normalizedVal = value;

			if (typeof value !== 'string') {
				normalizedVal = JSON.stringify(value);
			}

			sendMsgToFigma('set-pb-auth-token', { key: key, value: normalizedVal });
			pbAuthToken = value;
		}

		_storageRemove(key) {
			sendMsgToFigma('set-pb-auth-token', { key: key, value: '' });
			pbAuthToken = null;
		}

		// _bindStorageEvent() {
		// }
	}

	let pbAuthToken;

	const pb = new PocketBase(process.env.PB_BACKEND_URL, new FigmaAuthStore());

	let user;

	window.addEventListener('message', (event) => {
		if (event.data.pluginMessage.type == 'get-pb-auth-token') {
			if (!event.data.pluginMessage.data) return;

			pbAuthToken = JSON.parse(event.data.pluginMessage.data);

			try {
				// get an up-to-date auth store state by verifying and refreshing the loaded auth model (if any)
				pb.authStore.isValid && pb.collection('users').authRefresh();
			} catch (_) {
				// clear the auth store on failed refresh
				pb.authStore.clear();
			}
		}
	});

	async function login(form) {
		const email = form.querySelector('input[type="email"]').value;
		const password = form.querySelector('input[type="password"]').value;

		const userData = await pb.collection('users').authWithPassword(email, password);

		try {
			// get an up-to-date auth store state by verifying and refreshing the loaded auth model (if any)
			pb.authStore.isValid && pb.collection('users').authRefresh();
		} catch (_) {
			// clear the auth store on failed refresh
			pb.authStore.clear();
		}
	}

	async function logout() {
		await pb.authStore.clear();
	}
</script>

{#if user}
	<img
		class="avatar"
		src={`${process.env.PB_BACKEND_URL}/api/files/${user.collectionId}/${user.id}/${user.avatar}?token=`}
		alt="" />

	<button type="button" on:click={() => console.log(pb.authStore.isValid)}
		>Check vaild auth</button>
	<button type="button" on:click={() => logout()}>Logout</button>

	{#await pb.collection('projects').getList(1, 20, { sort: '-created', expand: 'owner' })}
		<Icon iconName={IconSpinner} color="blue" spin />
	{:then projects}
		{#each projects.items as project}
			<p>{project.name}</p>
		{/each}
	{/await}
{:else}
	<p>Not logged in</p>
	<form action="javascript:;" method="post" on:submit={(e) => login(e.target)}>
		<input type="email" value={process.env.TESTUSER_EMAIL} />
		<input type="password" value={process.env.TESTUSER_PASSWORD} />
		<button type="submit">Login</button>
	</form>
{/if}

<style>
	.avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
	}
</style>

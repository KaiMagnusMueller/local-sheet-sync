<script>
	import { Icon, IconSpinner } from 'figma-plugin-ds-svelte';

	import { createEventDispatcher } from 'svelte';
	import ViewWrapper from './ViewWrapper.svelte';

	export let user = null;
	export let pb;

	const dispatch = createEventDispatcher();

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

<ViewWrapper title="Profile">
	{#if user}
		<img
			class="avatar"
			src={`${process.env.PB_BACKEND_URL}/api/files/${user.collectionId}/${user.id}/${user.avatar}?token=`}
			alt="" />

		<button type="button" on:click={() => console.log(pb.authStore.isValid)}
			>Check vaild auth</button>
		<button type="button" on:click={() => logout()}>Logout</button>

		<!-- {#await pb.collection('projects').getList(1, 20, { sort: '-created', expand: 'owner' })}
			<Icon iconName={IconSpinner} color="blue" spin />
		{:then projects}
			{#each projects.items as project}
				<p>{project.name}</p>
			{/each}
		{/await} -->
	{:else}
		<p>Not logged in</p>
		<form action="javascript:;" method="post" on:submit={(e) => login(e.target)}>
			<input type="email" value={process.env.TESTUSER_EMAIL} />
			<input type="password" value={process.env.TESTUSER_PASSWORD} />
			<button type="submit">Login</button>
		</form>
	{/if}
</ViewWrapper>

<style>
	.avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
	}
</style>

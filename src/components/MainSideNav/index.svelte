<script>
	import { createEventDispatcher } from 'svelte';
	import MainSideNavItem from './MainSideNavItem.svelte';
	export let items = [];
	export let profile;

	const dispatch = createEventDispatcher();

	function handleItemClick(index) {
		dispatch('click', {
			index,
			item: items[index],
		});

		items = items.map((item, i) => {
			if (i === index) {
				return { ...item, active: true };
			} else {
				return { ...item, active: false };
			}
		});
	}
</script>

<nav>
	<ul>
		{#each items as item, index}
			<MainSideNavItem {item} on:click={() => handleItemClick(index)} />
		{/each}
	</ul>
	<ul>
		<li class="profile-img" title="Profile Img">
			<img src={profile.imgsrc} alt={profile.name} />
		</li>
	</ul>
</nav>

<style>
	nav {
		display: flex;
		flex-direction: column;
		padding: 0.5rem;
		background-color: var(--figma-color-bg-primary);
		justify-content: space-between;
		height: 100%;
		border-inline-end: 1px solid var(--figma-color-border);
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		list-style: none;
		/* padding: 0.5rem;
		border: 1px solid #000; */
	}

	li {
		width: 2rem;
		aspect-ratio: 1;
		user-select: none;
	}

	.nav-item {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		background-color: var(--figma-color-bg-secondary);
		border-radius: 6px;
		border: 2px solid transparent;
	}

	.nav-item.active {
		border-color: var(--figma-color-border-brand-strong);
	}

	.nav-item:hover {
		background-color: var(--figma-color-bg-hover);
	}

	.profile-img {
		border-radius: 9999px;
		background-color: var(--figma-color-bg-secondary);
		overflow: hidden;
		border: 2px solid var(--figma-color-border-brand-strong);
	}

	img {
		width: 100%;
		height: 100%;
	}
</style>

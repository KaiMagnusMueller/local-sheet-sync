<script>
	import { createEventDispatcher } from 'svelte';
	import MainSideNavItem from './MainSideNavItem.svelte';
	export let items = [];
	export let currentActiveItem = items.filter((elem) => elem.active)[0];
	export let previousActiveItem;

	const dispatch = createEventDispatcher();

	function handleItemClick(item) {
		dispatch('selectMainNavItem', {
			item: item,
		});

		const index = items.findIndex((elem) => elem === item);
		previousActiveItem = currentActiveItem;
		currentActiveItem = item;

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
		{#each items.filter((elem) => elem.group === 'TOP') as item, index}
			<MainSideNavItem {item} on:click={() => handleItemClick(item)} />
		{/each}
	</ul>
	<ul>
		{#each items.filter((elem) => elem.group === 'BOTTOM') as item, index}
			<MainSideNavItem {item} on:click={() => handleItemClick(item)} />
		{/each}
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
</style>

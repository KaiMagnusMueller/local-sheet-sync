<script>
	import { createEventDispatcher } from 'svelte';
	import Tab from './Tab.svelte';

	export let items = [];
	export let activeIndex;

	const dispatch = createEventDispatcher();

	function handleTabClick(index) {
		dispatch('click', {
			index,
			item: items[index],
		});
	}

	function handleButtonClick(index) {
		dispatch('buttonClick', {
			sheet: items[index],
		});
	}
</script>

<menu class="tab-bar">
	{#each items as item, index}
		<Tab
			{item}
			{activeIndex}
			{index}
			on:click={() => handleTabClick(index)}
			on:buttonClick={(e) => handleButtonClick(index)} />
	{/each}
</menu>

<style>
	menu {
		display: flex;
		flex-direction: row;
		gap: 0.25rem;
		align-items: center;
		padding-inline: 0.5rem;
		position: sticky;
		bottom: 0;
		overflow-x: scroll;
		flex-shrink: 0;
		padding-block-end: 0.75rem;
	}
</style>

<script>
	import { Icon, IconSpinner } from 'figma-plugin-ds-svelte';
	import ViewWrapper from './ViewWrapper.svelte';

	export let labelsWithDataInCurrentPage = [];
	export let isFetchingPlanningData;

	function getUint8Array(obj) {
		const array = Object.entries(obj).map(([key, value]) => {
			return value;
		});

		return URL.createObjectURL(new Blob([new Uint8Array(array).buffer], { type: 'image/png' }));
	}
</script>

<ViewWrapper title="Planning view">
	{#if labelsWithDataInCurrentPage.length > 0}
		<ul>
			{#each labelsWithDataInCurrentPage as label}
				<li>
					<img src={getUint8Array(label.preview)} alt="" width="300px" />
					{label.rootNode.name}
				</li>
			{/each}
		</ul>
	{:else if isFetchingPlanningData}
		<div class="loading-wrapper">
			<Icon iconName={IconSpinner} spin />
		</div>
	{:else}
		<p>No labels found</p>
	{/if}
</ViewWrapper>

<style>
	ul {
		list-style: none;
	}
	li {
		display: flex;

		gap: 0.5rem;
		margin: 0.5rem;
		border-radius: var(--border-radius-large);
	}

	li:hover {
		background-color: var(--figma-color-bg-hover);
	}

	.loading-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
	}
</style>

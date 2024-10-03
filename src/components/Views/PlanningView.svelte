<script>
	import { Icon, IconSpinner, IconButton } from 'figma-plugin-ds-svelte';
	import ViewWrapper from './ViewWrapper.svelte';
	import { sendMsgToFigma } from '../../lib/helper-functions';
	import CenteredCircles3 from '../../assets/icons/centered-circles-3.svg';

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
					<button>
						<div class="image">
							<img src={getUint8Array(label.preview)} alt="" />
							<div class="hover-controls">
								<IconButton
									rounded
									on:click={sendMsgToFigma('select-nodes', [label.rootNode.id])}
									iconName={CenteredCircles3} />
							</div>
						</div>
						<div class="details">
							<h2>{label.rootNode.name}</h2>
							<span>{label.rootNode.id}</span>
						</div>
					</button>
				</li>
			{/each}
		</ul>
	{:else if isFetchingPlanningData}
		<div class="loading-wrapper">
			<Icon iconName={IconSpinner} spin />
			<p>Getting bindings for current page/selection</p>
		</div>
	{:else}
		<p>No labels found</p>
	{/if}
</ViewWrapper>

<style>
	ul {
		list-style: none;
	}

	button {
		appearance: none;
		border: none;
		background-color: var(--figma-color-bg);
		display: flex;
		/* gap: 0.5rem; */
		margin: 0.5rem;
		padding: 0;
		width: -webkit-fill-available;
		border-radius: var(--border-radius-large);
		text-align: left;
	}

	/* button:hover {
		background-color: var(--figma-color-bg-hover);
	} */

	.image {
		border-radius: var(--border-radius-large);
		aspect-ratio: 1.75/1;
		height: 128px;
		background-color: var(--figma-color-bg-secondary);
		padding: 0.5rem;
		position: relative;
		/* border: 2px solid var(--figma-color-border); */
	}

	.hover-controls {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem;
		display: none;
		background-color: var(--figma-color-bg);
		border-radius: 9px;
		box-shadow:
			0px 0px 0.5px rgba(0, 0, 0, 0.3),
			0px 1px 3px rgba(0, 0, 0, 0.15);
	}

	button:hover .hover-controls {
		display: block;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.details {
		margin: 0.5rem;
		font-size: var(--font-size-xsmall);
		font-weight: var(--font-weight-normal);
		line-height: var(--font-line-height);
		position: relative;
		width: -webkit-fill-available;
	}

	h2 {
		font-size: var(--font-size-xsmall);
		font-weight: var(--font-weight-bold);
		line-height: var(--font-line-height);
	}

	.loading-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		flex-direction: column;
	}
</style>

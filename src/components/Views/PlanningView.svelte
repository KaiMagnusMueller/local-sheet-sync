<script>
	import { Icon, IconSpinner, IconButton, IconBack, IconForward } from 'figma-plugin-ds-svelte';
	import ViewWrapper from './ViewWrapper.svelte';
	import { sendMsgToFigma, getUint8Array } from '../../lib/helper-functions';
	import CenteredCircles3 from '../../assets/icons/centered-circles-3.svg';
	import NodeDetailView from '../NodeDetailView.svelte';
	import NodePreview from '../NodePreview.svelte';

	export let labelsWithDataInCurrentPage = [];
	export let isFetchingPlanningData;

	function switchView(node = null, title = 'Planning view') {
		console.log('switchView', node, title);

		if (node === null) {
			selectedNode = null;
			viewTitle = 'Planning view';
			showNavBack = false;
		} else {
			selectedNode = node;
			viewTitle = title;
			showNavBack = true;
		}
	}

	let viewTitle = 'Planning view';
	let selectedNode;
	let showNavBack = false;
</script>

<ViewWrapper title={viewTitle} on:navBack={() => switchView()} {showNavBack}>
	{#if labelsWithDataInCurrentPage.length > 0}
		{#if selectedNode}
			<NodeDetailView node={selectedNode} />
		{:else}
			<ul>
				{#each labelsWithDataInCurrentPage as label}
					<li>
						<button>
							<div class="image">
								<NodePreview image={label.preview} />

								<div class="hover-controls">
									<IconButton
										rounded
										on:click={sendMsgToFigma('select-nodes', [
											label.rootNode.id,
										])}
										iconName={CenteredCircles3} />
								</div>
							</div>
							<div class="details">
								<h2>{label.rootNode.name}</h2>
								<span>{label.rootNode.id}</span>
							</div>
							<div class="list-item-controls">
								<IconButton
									on:click={() => switchView(label, label.rootNode.name)}
									rounded
									iconName={IconForward} />
							</div>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
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
		align-items: stretch;
	}

	/* button:hover {
		background-color: var(--figma-color-bg-hover);
	} */

	.image {
		position: relative;
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

	.details {
		margin: 0.5rem;
		font-size: var(--font-size-xsmall);
		font-weight: var(--font-weight-normal);
		line-height: var(--font-line-height);
		position: relative;
		flex-grow: 1;
	}

	.list-item-controls {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.loading-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		flex-direction: column;
	}
</style>

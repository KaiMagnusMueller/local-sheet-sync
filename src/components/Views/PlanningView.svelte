<script>
	import { Icon, IconSpinner, IconButton, IconForward } from 'figma-plugin-ds-svelte';
	import ViewWrapper from './ViewWrapper.svelte';
	import { sendMsgToFigma } from '../../lib/helper-functions';
	import CenteredCircles3 from '../../assets/icons/centered-circles-3.svg';
	import NodePreview from '../NodePreview.svelte';
	import SelectedNodesView from '../SelectedNodesView.svelte';

	export let labelGroups = [];
	export let isFetchingPlanningData;
	export let selectedNodes = [];

	let viewBreadcrumbData = [labelGroups];
	let navBreadcrumbs = ['Planning view'];

	function appendView(nodes) {
		// console.log('appendView', nodes);
		if (nodes.length === 1) {
			navBreadcrumbs = [...navBreadcrumbs, nodes[0].rootNode.name];
			viewBreadcrumbData = [...viewBreadcrumbData, [...nodes]];
		} else if (nodes.length > 1) {
			navBreadcrumbs = [...navBreadcrumbs, `${nodes.length} Layers Selected`];
			viewBreadcrumbData = [...viewBreadcrumbData, [...nodes]];
		} else {
			console.log('no nodes selected');
		}
	}

	function removeView(index) {
		// console.log('removeView', index);
		navBreadcrumbs = navBreadcrumbs.slice(0, index + 1);
		viewBreadcrumbData = viewBreadcrumbData.slice(0, index + 1);

		// Reactive
		navBreadcrumbs = navBreadcrumbs;
		viewBreadcrumbData = viewBreadcrumbData;
	}

	$: {
		removeView(0);
		appendView(selectedNodes);
	}
</script>

<ViewWrapper breadcrumbs={navBreadcrumbs} on:navToIndex={(e) => removeView(e.detail)}>
	{#if (selectedNodes.length > 0 || labelGroups.length > 0) && navBreadcrumbs.at(-1) !== 'Planning view'}
		<SelectedNodesView groups={viewBreadcrumbData.at(-1)} />
	{:else if labelGroups.length > 0 && navBreadcrumbs.at(-1) === 'Planning view'}
		<ul>
			{#each labelGroups as group}
				<li>
					<button>
						<NodePreview images={[group.preview]}>
							<IconButton
								slot="hoverControls"
								rounded
								on:click={sendMsgToFigma('select-nodes', [group.rootNode.id])}
								iconName={CenteredCircles3} />
						</NodePreview>

						<div class="details">
							<h2>{group.rootNode.name}</h2>
							<span>{group.rootNode.id}</span>
						</div>
						<div class="list-item-controls">
							<IconButton
								on:click={() => appendView([group])}
								rounded
								iconName={IconForward} />
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
		padding: 0;
		display: flex;
		/* gap: 0.5rem; */
		margin: 0.5rem;
		width: -webkit-fill-available;
		align-items: stretch;
		height: 8rem;
	}

	/* button:hover {
		background-color: var(--figma-color-bg-hover);
	} */

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

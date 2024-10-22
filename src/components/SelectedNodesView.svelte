<script>
	import { IconButton, IconList, IconListTile } from 'figma-plugin-ds-svelte';
	import { sendMsgToFigma } from '../lib/helper-functions';
	import CenteredCircles3 from '../assets/icons/centered-circles-3.svg';
	import NodePreview from './NodePreview.svelte';
	import { getLabels } from '../lib/handle-labels';
	import { transformGroupedNodes } from '../lib/node-tree-helpers';
	import LabelTagGroup from './LabelTagGroup.svelte';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let groups = [];

	// TODO: Make breadcrumb append element independent from selecting nodes and the breadcrumb data?
	// console.log('appendView', rootNode), dispatch('appendView', [rootNode]);
	// console.log(groups);

	const assignableProperties = new Map([
		['TEXT', new Set(['text', 'fills', 'strokes'])],
		['INSTANCE', new Set(['swapComponent', 'fills', 'strokes'])],
		['FRAME', new Set(['fills', 'strokes'])],
	]);

	const supportedProperties = new Map([
		['text', { label: 'Text' }],
		['fills', { label: 'Fill' }],
		['strokes', { label: 'Stroke' }],
		['swapComponent', { label: 'Variant' }],
	]);

	function getCommonProperties(groups) {
		if (groups.length === 0) return new Set();

		const allProperties = groups.map(
			(group) => assignableProperties.get(group.rootNode.type) || new Set(),
		);
		return allProperties.reduce((acc, properties) => {
			return new Set([...acc].filter((x) => properties.has(x)));
		});
	}

	console.log(getCommonProperties(groups));

	$: {
		transformedNodes = groups.map((selectedNode) =>
			transformGroupedNodes(selectedNode.groupedNodesWithLabels),
		);
		// console.log(transformedNodes);
	}

	let transformedNodes = [];

	function handleChooseDataField(e) {
		console.log(e);
	}
</script>

<div class="node-detail-view">
	<div class="node-properties">
		<div class="node-preview">
			<NodePreview aspectRatio={'1/1'} images={groups.map((group) => group.preview)}>
				<!-- TODO: Hover controls are not displayed, even though they should -->
				{#if groups.length === 1}
					<IconButton
						slot="hoverControls"
						rounded
						on:click={sendMsgToFigma('select-nodes', [groups[0].rootNode.id])}
						iconName={CenteredCircles3} />
				{/if}
			</NodePreview>
			<h2 class="line-clamp">
				{#if groups.length > 1}
					{groups.length} Layers Selected
				{:else}
					{groups[0].rootNode.name}
				{/if}
			</h2>
		</div>
		<div class="attribute-list">
			<h3>Properties</h3>
			<ul>
				{#if getCommonProperties(groups).size > 0}
					{#each getCommonProperties(groups) as property}
						<li>
							<button
								class="small flex-grow"
								style="flex-grow: 1;"
								on:click={(e) => handleChooseDataField(property)}
								>{supportedProperties.get(property).label}</button>
						</li>
					{/each}
				{:else}
					<li>Layer has no assignable properties or is not supported</li>
				{/if}
			</ul>
		</div>
	</div>

	{#if transformedNodes}
		<div class="grouped-nodes">
			<div class="horizontal-group justify-content-between align-items-center">
				<!-- <h2>Groups in {transformedNodes.length > 1 ? 'these Elements' : 'this Element'}</h2> -->
				<h2>Groups</h2>

				<div class="nested-flex-group">
					<IconButton rounded disabled iconName={IconList} />
					<IconButton rounded disabled iconName={IconListTile} />
				</div>
			</div>

			{#each transformedNodes as selectedNode}
				{#each selectedNode as rootNode}
					{@const nodeLabels = getLabels(rootNode.name)}
					<div class="node-group-wrapper">
						<header>
							<div class="nested-flex-group">
								<h3>{nodeLabels.nodeName}</h3>
								<LabelTagGroup labels={nodeLabels.existingLabels}></LabelTagGroup>
							</div>
							<IconButton
								rounded
								on:click={sendMsgToFigma('select-nodes', [rootNode.id])}
								iconName={CenteredCircles3} />
						</header>
						{#if rootNode.childNodes[0].length > 1}
							<div class="node-group">
								<IconButton
									rounded
									class="auto-height"
									on:click={sendMsgToFigma('select-nodes', [
										...rootNode.childNodes.flat().map((node) => node.id),
									])}
									iconName={CenteredCircles3} />
								<!-- Was zeigt das nochmal? -->
								<!-- <p>{group.length} layer(s) with this label</p> -->
								<ul>
									{#each rootNode.childNodes as group, index}
										{@const firstNode = group[0]}
										{@const nodeLabels = getLabels(firstNode.name)}

										<li>
											<!-- <div class="nested-flex-group gap-025">
												{group.length} layers with data <LabelTagGroup
													labels={nodeLabels.existingLabels}
												></LabelTagGroup> bound to
												<span class="tag white">Text content</span>
											</div> -->
											<div class="nested-flex-group gap-025">
												{group.length} layers with
												<span class="tag gray">Text content</span>
												as <LabelTagGroup labels={nodeLabels.existingLabels}
												></LabelTagGroup>
											</div>
											<IconButton
												rounded
												on:click={sendMsgToFigma('select-nodes', [
													...group.flat().map((node) => node.id),
												])}
												iconName={CenteredCircles3} />
											<!-- <div class="nested-flex-group"></div> -->
										</li>

										<!-- <header>
										<div class="nested-flex-group">
											<LabelTagGroup labels={nodeLabels.existingLabels}
											></LabelTagGroup>
										</div>
									</header>
									{#each group as child, index}
										{@const nodeLabels = getLabels(child.name)}
										<li>
											<div class="nested-flex-group">
												<span class="tag">{index}</span>
												<span>{nodeLabels.nodeName}</span>

												<IconButton
													rounded
													on:click={sendMsgToFigma('select-nodes', [
														child.id,
													])}
													iconName={CenteredCircles3} />
											</div>
										</li>
									{/each} -->
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				{/each}
			{/each}

			{#if false}
				{#each groups as selectedNode}
					{#each selectedNode.groupedNodesWithLabels as group}
						{#each group as node}
							{@const nodeLabels = getLabels(node.name)}
							<div class="node-group-wrapper">
								<header>
									<div class="nested-flex-group">
										<h3>{nodeLabels.nodeName}</h3>
										<LabelTagGroup labels={nodeLabels.existingLabels}
										></LabelTagGroup>
									</div>
									<IconButton
										rounded
										on:click={sendMsgToFigma('select-nodes', [node.id])}
										iconName={CenteredCircles3} />
								</header>
								<div class="node-group">
									<IconButton
										rounded
										class="auto-height"
										on:click={sendMsgToFigma('select-nodes', [
											...node.childNodes.map((node) => node.id),
										])}
										iconName={CenteredCircles3} />
									<!-- Was zeigt das nochmal? -->
									<!-- <p>{group.length} layer(s) with this label</p> -->
									<ul>
										{#each node.childNodes as child, index}
											{@const nodeLabels = getLabels(child.name)}
											<li>
												<div class="nested-flex-group">
													<!-- {#if index + 1 < node.childNodes.length}
													<span>┣</span>
												{:else}
													<span>┗</span>
												{/if} -->
													<span class="tag">{index}</span>
													<span>{nodeLabels.nodeName}</span>
													<LabelTagGroup
														labels={nodeLabels.existingLabels}
													></LabelTagGroup>
												</div>
												<!-- <div class="hover-controls"> -->
												<IconButton
													rounded
													on:click={sendMsgToFigma('select-nodes', [
														child.id,
													])}
													iconName={CenteredCircles3} />
												<!-- </div> -->
											</li>
										{/each}
									</ul>
								</div>
							</div>
						{/each}
					{/each}
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	.node-preview {
		width: 10rem;
		/* padding: 0.5rem; */
	}

	.node-detail-view {
		display: grid;
		grid-template-columns: max-content 1fr;
		grid-template-rows: 1fr;
		gap: 0.5rem;
		padding-inline: 0.5rem;
		background-color: var(--figma-color-bg);
		align-items: start;
	}

	.node-detail-view > div {
		padding-block: 0.5rem;
	}

	.node-properties {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		position: sticky;
		top: 0;
	}

	h2 {
		font-size: var(--font-size-large);
		font-weight: var(--font-weight-semibold);
		padding-inline: 0.5rem;
	}

	.node-preview,
	.attribute-list {
		display: flex;
		flex-direction: inherit;
		gap: 0.5rem;
	}

	.attribute-list h3 {
		padding-inline: 0.5rem;
	}

	.grouped-nodes {
		display: flex;
		gap: 0.75rem;
		flex-direction: column;
		/* margin-block-start: 0.75rem; */
	}

	/* .node-group-wrapper {
		border-radius: var(--border-radius-large);
		border: 1px solid transparent;
	} */

	/* .node-group-wrapper:hover {
		border-radius: var(--border-radius-large);
		background-color: var(--figma-color-bg-hover);
		padding: 0.5rem;
		margin-block-end: 0.75rem;
		border: 1px solid var(--figma-color-border);
	} */

	.node-group {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
	}

	ul {
		flex-grow: 1;
	}

	li,
	header {
		border-radius: var(--border-radius-large);
		padding-block: 0.125rem;
		padding-inline: 0.125rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: relative;
		gap: 0.5rem;
		background-color: var(--figma-color-bg);
		flex-wrap: wrap;
	}

	/* li:hover,
	header:hover {
		background-color: var(--figma-color-bg-hover);
		user-select: none;
	} */

	/* header {
		position: sticky;
		top: 0;
		z-index: 1;
	} */

	:global(.auto-height) {
		height: auto !important;
	}

	.tag {
		min-width: 1.375rem;
		text-align: center;
	}
</style>

<script>
	import { IconButton, IconList, IconListTile } from 'figma-plugin-ds-svelte';
	import { sendMsgToFigma } from '../lib/helper-functions';
	import CenteredCircles3 from '../assets/icons/centered-circles-3.svg';
	import NodePreview from './NodePreview.svelte';
	import { getLabels } from '../lib/handle-labels';
	import { transformGroupedNodes } from '../lib/node-tree-helpers';
	import LabelTagGroup from './LabelTagGroup.svelte';

	export let groups = [];

	console.log(groups);

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

	$: {
		transformedNodes = transformGroupedNodes(groups[0].groupedNodesWithLabels);
		console.log(transformedNodes);
	}

	let transformedNodes = [];
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
			<h2>
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
				{#if getCommonProperties(groups)}
					{#each getCommonProperties(groups) as property}
						<li>{supportedProperties.get(property).label}</li>
					{/each}
				{:else}
					<li>Layer has no assignable properties</li>
				{/if}
			</ul>
		</div>
	</div>

	{#if transformedNodes}
		<div class="grouped-nodes">
			<div class="horizontal-group justify-content-between align-items-center">
				<h2>Groups in this Element</h2>

				<div class="nested-flex-group">
					<IconButton rounded disabled iconName={IconList} />
					<IconButton rounded disabled iconName={IconListTile} />
				</div>
			</div>

			{#each transformedNodes as rootNode}
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
									...rootNode.childNodes.map((node) => node.id),
								])}
								iconName={CenteredCircles3} />
							<!-- Was zeigt das nochmal? -->
							<!-- <p>{group.length} layer(s) with this label</p> -->
							<ul>
								{#each rootNode.childNodes as group, index}
									{@const firstNode = group[0]}
									{@const nodeLabels = getLabels(firstNode.name)}

									<li>
										{group.length} layers with <LabelTagGroup
											labels={nodeLabels.existingLabels}></LabelTagGroup>
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
		width: 14rem;
		/* padding: 0.5rem; */
	}

	.node-detail-view {
		display: grid;
		grid-template-columns: 1fr 2fr;
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
		padding-inline: 0.5rem 0.125rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: relative;
		gap: 0.5rem;
		background-color: var(--figma-color-bg);
	}

	li:hover,
	header:hover {
		background-color: var(--figma-color-bg-hover);
		user-select: none;
	}

	/* header {
		position: sticky;
		top: 0;
		z-index: 1;
	} */

	.nested-flex-group {
		display: inherit;
		gap: inherit;
		align-items: inherit;
		justify-content: initial;
	}

	:global(.auto-height) {
		height: auto !important;
	}

	.tag {
		min-width: 1.375rem;
		text-align: center;
	}
</style>

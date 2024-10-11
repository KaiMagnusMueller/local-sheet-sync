<script>
	import { IconButton } from 'figma-plugin-ds-svelte';
	import { sendMsgToFigma } from '../lib/helper-functions';
	import CenteredCircles3 from '../assets/icons/centered-circles-3.svg';
	import NodePreview from './NodePreview.svelte';

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

	{#if groups[0] && groups[0].groupedNodesWithLabels.length > 0}
		<div class="grouped-nodes">
			<h2>Groups in this Element</h2>
			{#each groups as selectedNode}
				{#each selectedNode.groupedNodesWithLabels as group}
					{#each group as node}
						<header>
							<h3>{node.name}</h3>
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
							<p>{group.length} layer(s) with this label</p>
							<ul>
								{#each node.childNodes as child}
									<li>
										<span>{child.name}</span>
										<!-- <div class="hover-controls"> -->
										<IconButton
											rounded
											on:click={sendMsgToFigma('select-nodes', [child.id])}
											iconName={CenteredCircles3} />
										<!-- </div> -->
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				{/each}
			{/each}
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

	.node-group {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
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
	}

	li:hover,
	header:hover {
		background-color: var(--figma-color-bg-hover);
		user-select: none;
	}

	:global(.auto-height) {
		height: auto !important;
	}
</style>

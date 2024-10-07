<script>
	import { sendMsgToFigma } from '../lib/helper-functions';
	import { IconButton } from 'figma-plugin-ds-svelte';
	import NodePreview from './NodePreview.svelte';
	import CenteredCircles3 from '../assets/icons/centered-circles-3.svg';

	export let nodes = [];

	console.log(nodes);
</script>

<div class="node-detail-view">
	{#if nodes.length <= 1}
		<div class="node-attributes">
			<div class="node-preview">
				<NodePreview image={nodes[0].preview}>
					<IconButton
						slot="hoverControls"
						rounded
						on:click={sendMsgToFigma('select-nodes', [nodes[0].rootNode.id])}
						iconName={CenteredCircles3} />
				</NodePreview>
				<h2>{nodes[0].rootNode.name}</h2>
			</div>
			<div class="attribute-list">
				<h3>Attributes</h3>
				<ul>
					<li>Text</li>
				</ul>
			</div>
		</div>
	{:else}
		<p>Multiple nodes selected</p>
	{/if}

	{#if nodes[0] && nodes[0].groupedNodesWithLabels.length > 0}
		<div class="grouped-nodes">
			<h2>Groups in this Element</h2>
			{#each nodes[0].groupedNodesWithLabels as group}
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
		</div>
	{/if}
	<div class="data-sources">
		<table>
			<thead>
				<tr>
					<th>Col 1</th>
					<th>Col 2</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Row 1 Col 1</td>
					<td>Row 1 Col 2</td>
				</tr>
				<tr>
					<td>Row 2 Col 1</td>
					<td>Row 2 Col 2</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>

<style>
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

	.node-attributes {
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

	.hover-controls {
		display: none;
		position: absolute;
		right: 0;
	}

	li:hover .hover-controls {
		display: block;
	}

	:global(.auto-height) {
		height: auto !important;
	}
</style>

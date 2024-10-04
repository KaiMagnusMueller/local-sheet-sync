<script>
	import { sendMsgToFigma } from '../lib/helper-functions';
	import { IconButton } from 'figma-plugin-ds-svelte';
	import NodePreview from './NodePreview.svelte';
	import CenteredCircles3 from '../assets/icons/centered-circles-3.svg';

	export let node;

	console.log('NodeDetailView', node);
</script>

<div class="node-detail-view">
	<div class="node-attributes">
		<NodePreview image={node.preview} />
		<h2>Attributes</h2>

		<ul>
			<li>Text</li>
		</ul>
	</div>
	{#if node.groupedNodesWithLabels.length > 0}
		<div class="grouped-nodes">
			<h2>Groups in this Element</h2>
			{#each node.groupedNodesWithLabels as group}
				{#each group as rootNode}
					<header>
						<h3>{rootNode.name}</h3>
						<IconButton
							rounded
							on:click={sendMsgToFigma('select-nodes', [rootNode.id])}
							iconName={CenteredCircles3} />
					</header>
					<div class="node-group">
						<IconButton
							rounded
							class="auto-height"
							on:click={sendMsgToFigma('select-nodes', [
								...rootNode.childNodes.map((node) => node.id),
							])}
							iconName={CenteredCircles3} />
						<ul>
							{#each rootNode.childNodes as node}
								<li>
									<span>{node.name}</span>
									<!-- <div class="hover-controls"> -->
									<IconButton
										rounded
										on:click={sendMsgToFigma('select-nodes', [node.id])}
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
		padding: 0.5rem;
		background-color: var(--figma-color-bg);
	}

	.node-attributes {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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

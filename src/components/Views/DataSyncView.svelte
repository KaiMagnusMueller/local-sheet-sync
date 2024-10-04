<script>
	import FileInput from '../FileInput.svelte';
	import DataDisplay from '../DataDisplay.svelte';
	import TabBar from '../TabBar/index.svelte';
	import { Button, IconSpinner, Icon } from 'figma-plugin-ds-svelte';
	import CellContent from '../Table/CellContent.svelte';

	// Variables to store workbook and sheet data
	export let sheetNames;
	export let currentFile;
	export let isApplyingData = false;
	export let mostRecentHistoryItem;
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function handleAssignLabel(e) {
		parent.postMessage(
			{
				pluginMessage: {
					type: 'assign-layer-name',
					data: {
						sheet: e.detail.sheet,
						column: e.detail.column,
						row: e.detail.row,
					},
				},
			},
			'*',
		);
	}
</script>

{#if !!currentFile.fileName}
	<header>
		<TabBar
			items={sheetNames}
			activeIndex={currentFile.activeSheet}
			on:click={(e) => dispatch('select-sheet', { index: e.detail.index })}
			on:buttonClick={(e) => handleAssignLabel(e)} />
	</header>

	<div class="table-wrapper">
		<table>
			{#if currentFile.data[currentFile.activeSheet].header}
				<thead>
					<tr>
						{#each currentFile.data[currentFile.activeSheet].header as colHeaderCell}
							<th title={colHeaderCell}>
								<CellContent
									content={colHeaderCell}
									header
									on:buttonClick={() =>
										handleAssignLabel({
											detail: { column: colHeaderCell },
										})} />
							</th>
						{/each}
					</tr>
				</thead>
			{/if}
			<tbody>
				{#each currentFile.data[currentFile.activeSheet].data as row, index}
					<tr>
						{#each row as cell, cellIndex}
							<td title={cell}>
								<CellContent
									content={cell}
									on:buttonClick={() =>
										handleAssignLabel({
											detail: { row: index },
										})} />
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
<footer>
	<!-- File input to upload Excel file -->
	<FileInput
		on:change={(e) => dispatch('file-input', e.target.files)}
		fileName={currentFile.fileName}
		lastUpdatedTime={currentFile.date} />
	<div class="horizontal-group">
		{#if isApplyingData}
			<Icon iconName={IconSpinner} color="blue" spin />
		{/if}
		{#if mostRecentHistoryItem}
			<DataDisplay label={'Last updated'}
				>{new Date(mostRecentHistoryItem.timestamp).toLocaleString([], {
					day: 'numeric',
					month: 'numeric',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
				})}</DataDisplay>
		{/if}
		<Button on:click={() => dispatch('apply-data')} disabled={isApplyingData}
			>Apply data</Button>
	</div>
</footer>

<style>
	header {
		padding-block-start: 0.5rem;
	}

	footer {
		border-block-start: 1px solid var(--figma-color-border);
		padding-block: 0.5rem;
		display: flex;
		padding-inline: 0.5rem;
		justify-content: space-between;
		position: sticky;
		bottom: 0;
		background-color: var(--figma-color-bg);
	}

	.table-wrapper {
		padding-inline: 0.5rem;
		overflow: scroll;
		flex-grow: 1;
	}

	table {
		margin-block-end: 0.5rem;
	}
</style>

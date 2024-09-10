<script>
	import PBAuthTest from './PBAuthTest.svelte';

	import * as XLSX from 'xlsx';
	import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
	import FileInput from './components/FileInput.svelte';
	import TabBar from './components/TabBar/index.svelte';
	import { Button, IconSpinner, Icon } from 'figma-plugin-ds-svelte';
	import CellContent from './components/Table/CellContent.svelte';

	// Variables to store workbook and sheet data
	let workbook;
	let sheetNames;
	let worksheet;
	let activeSheet;
	let activeSheetName;

	window.addEventListener('message', (event) => {
		if (event.data.pluginMessage.type == 'restore-sheet') {
			if (event.data.pluginMessage.data) {
				// Read the workbook from the file data

				const data = decompressFromUTF16(event.data.pluginMessage.data);
				workbook = JSON.parse(data);

				console.log(workbook);

				// Get sheet names and the first sheet
				sheetNames = workbook.SheetNames;

				const firstSheetName = workbook.SheetNames[0];

				// Get the first worksheet and convert it to JSON
				worksheet = workbook.Sheets[firstSheetName];

				// Select the first sheet by default
				selectSheet(0);
			} else {
				console.log('no data to restore found');
			}
		}
		if (event.data.pluginMessage.type == 'done-apply-data') {
			isApplyingData = false;
			console.timeEnd('Elapsed time');
		}
	});

	// Function to handle file input change event
	function handleFileInput(e) {
		console.log(e);

		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const data = new Uint8Array(e.target.result);

			// Read the workbook from the file data
			workbook = XLSX.read(data, { type: 'array' });

			saveSheet(workbook);

			// Get sheet names and the first sheet
			sheetNames = workbook.SheetNames;
			const firstSheetName = workbook.SheetNames[0];

			// Get the first worksheet and convert it to JSON
			worksheet = workbook.Sheets[firstSheetName];

			// Select the first sheet by default
			selectSheet(0);
		};
		reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
	}

	async function saveSheet(data) {
		const dataToSave = compressToUTF16(JSON.stringify(data));

		parent.postMessage(
			{
				pluginMessage: {
					type: 'save-sheet',
					data: dataToSave,
				},
			},
			'*',
		);
	}

	// Function to select a sheet by index
	function selectSheet(index) {
		if (!workbook) return;

		const sheet = workbook.Sheets[sheetNames[index]];
		activeSheetName = sheetNames[index];

		return (activeSheet = formatAndCleanSheet(sheet, index));
	}

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

	let isApplyingData = false;

	function handleApplyData(e) {
		isApplyingData = true;

		const sheetNames = Object.keys(workbook.Sheets);

		const allSheets = sheetNames.map((sheetName, i) => {
			const sheet = workbook.Sheets[sheetName];
			return formatAndCleanSheet(sheet, i);
		});

		parent.postMessage(
			{
				pluginMessage: {
					type: 'apply-data',
					data: allSheets,
				},
			},
			'*',
		);
		console.time('Elapsed time');
	}

	function formatAndCleanSheet(sheet, index) {
		let _sheet = XLSX.utils.sheet_to_json(sheet, {
			header: 1,
			defval: '',
			blankrows: false,
			skipHidden: true,
		});

		//Search for empty columns in header row
		let indexOfEmptyCell = -1;
		for (let i = 1; i < _sheet[0].length; i++) {
			let cell = _sheet[0][i];
			if (cell === '') {
				indexOfEmptyCell = i;
				break;
			}
		}

		// TODO: Move this to a separate function in the future
		if (indexOfEmptyCell !== -1) {
			// console.log(
			// 	'Empty column with index',
			// 	indexOfEmptyCell,
			// 	'detected. Removing',
			// 	_sheet[0].length - indexOfEmptyCell,
			// 	'columns.',
			// );

			//Remove empty columns
			for (let i = 0; i < _sheet.length; i++) {
				_sheet[i].splice(indexOfEmptyCell, _sheet[i].length - indexOfEmptyCell);
			}
		}

		return {
			name: sheetNames[index],
			header: _sheet[0],
			data: _sheet.slice(1),
		};
	}
</script>

<div class="wrapper">
	<!-- Display the selected sheet data in a table -->
	<main>
		<PBAuthTest></PBAuthTest>

		{#if activeSheet}
			<header>
				<TabBar
					items={sheetNames}
					activeItem={activeSheetName}
					on:click={(e) => selectSheet(e.detail.index)}
					on:buttonClick={(e) => handleAssignLabel(e)} />
			</header>

			<div class="table-wrapper">
				<table>
					{#if activeSheet.header}
						<thead>
							<tr>
								{#each activeSheet.header as colHeaderCell}
									<th>
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
						{#each activeSheet.data as row, index}
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
	</main>
	<footer>
		<!-- File input to upload Excel file -->
		<FileInput on:change={handleFileInput} />
		<div class="horizontal-group">
			{#if isApplyingData}
				<Icon iconName={IconSpinner} color="blue" spin />
			{/if}
			<Button on:click={(e) => handleApplyData(e)} disabled={isApplyingData}
				>Apply data</Button>
		</div>
	</footer>
</div>

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		color: var(--figma-color-text);
	}

	.wrapper {
		width: 100%;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	main {
		display: flex;
		flex-direction: column;
		overflow: scroll;
		flex-grow: 1;
		gap: 0.5rem;
	}

	header {
		padding-block-start: 0.5rem;
		margin-block-end: -0.5rem;
	}

	footer {
		border-block-start: 1px solid var(--figma-color-border);
		padding-block: 0.5rem;
		display: flex;
		padding-inline: 0.5rem;
		justify-content: space-between;
	}

	.table-wrapper {
		padding-inline: 0.5rem;
		overflow: scroll;
	}

	table {
		border-collapse: collapse;
		font-size: var(--font-size-xsmall);
		margin-block-end: 0.5rem;
	}

	th,
	td {
		border: 1px solid var(--figma-color-border);
		overflow: hidden;
	}

	thead {
		/* position: sticky;
		top: 0; */
		background-color: var(--figma-color-bg);
		border-block-start: 1px solid var(--figma-color-border);
	}

	th:first-of-type {
		border-top-left-radius: var(--border-radius-large);
	}

	menu {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		overflow-x: scroll;
		position: sticky;
		bottom: 0;
		background-color: var(--figma-color-bg);
		border-block-start: 1px solid var(--figma-color-border);

		padding: 0.5rem;
		padding-block-end: 0.8rem;
		flex-shrink: 0;
	}

	ul {
		list-style: none;
		display: contents;
		/* padding: 0.5rem;
		border: 1px solid #000; */
	}

	button {
		display: flex;
		align-items: center;
		padding: 0.25rem;
		background-color: var(--figma-color-bg-secondary);
	}

	button.active {
		background-color: var(--figma-color-highlight);
	}

	button span {
		pointer-events: none;
	}

	:global(.line-clamp-3) {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	:global(.line-clamp-2) {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	:global(.line-clamp) {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.pointer-none {
		pointer-events: none;
	}

	:global(.horizontal-group) {
		display: flex;
		gap: 0.5rem;
	}

	/* main {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		gap: 0.5rem;
	} */

	/* header {
		padding-block-start: 0.5rem;
		margin-block-end: -0.5rem;
		backdrop-filter: blur(10px);
		background-color: rgba(255, 255, 255, 0.716);
		position: sticky;
		top: 0;
	} */

	/* footer {
		border-block-start: 1px solid var(--figma-color-border);
		padding-block: 0.5rem;
		display: flex;
		padding-inline: 0.5rem;
		justify-content: space-between;
		position: sticky;
		bottom: 0;
		background-color: var(--figma-color-bg);
	} */
</style>

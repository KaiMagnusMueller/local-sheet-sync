<script>
	import * as XLSX from 'xlsx';
	import { sendMsgToFigma } from './lib/helper-functions';
	import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
	import FileInput from './components/FileInput.svelte';
	import TabBar from './components/TabBar/index.svelte';
	import { Button, IconSpinner, Icon } from 'figma-plugin-ds-svelte';
	import CellContent from './components/Table/CellContent.svelte';

	let isApplyingData = false;
	let currentSaveVersion = '0.1';

	let currentUser = {
		id: '',
		name: '',
	};

	// Variables to store workbook and sheet data
	let sheetNames;

	let currentFile = {
		fileName: '',
		date: '',
		data: {},
		activeSheet: 0,
		createdByUser: {
			id: '',
			name: '',
		},
		saveVersion: '',
	};

	// function initializeDataSheet(fileName) {}

	// class DataSheet {
	// 	constructor(name, date, data) {
	// 		this.name = name;
	// 		this.date = date;
	// 		this.workbook = data;
	// 		this.activeSheet = this.workbook.SheetNames[0];
	// 	}

	// 	set activeSheet(index) {
	// 		this.activeSheet = workbook.SheetNames[index];
	// 	}

	// 	get activeSheet() {
	// 		return this.activeSheet;
	// 	}
	// }

	window.addEventListener('message', (event) => {
		if (event.data.pluginMessage.type == 'restore-sheet') {
			if (event.data.pluginMessage.data) {
				// Read the workbook from the file data

				const data = decompressFromUTF16(event.data.pluginMessage.data);
				currentFile = JSON.parse(data);
				console.log(currentFile);

				sheetNames = currentFile.data.map((sheet) => sheet.name);
			} else {
				console.log('no data to restore found');
			}
		}
		if (event.data.pluginMessage.type == 'done-apply-data') {
			isApplyingData = false;
			console.timeEnd('Elapsed time');
		}
		if (event.data.pluginMessage.type === 'current-user') {
			currentUser = event.data.pluginMessage.data;
		}
	});

	// Function to handle file input change event
	function handleFileInput(e) {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
		reader.onload = (e) => {
			const data = new Uint8Array(e.target.result);

			// Read the workbook from the file data
			const workbook = XLSX.read(data, { type: 'array' });
			console.log(workbook);

			const sheets = workbook.SheetNames.map((sheetName, i) => {
				const sheet = workbook.Sheets[sheetName];
				return formatAndCleanSheet(sheet, sheetName, i);
			});

			currentFile = {
				fileName: file.name,
				date: new Date().toISOString(),
				data: sheets,
				activeSheet: 0,
				createdByUser: currentUser,
				currentSaveVersion: currentSaveVersion,
			};

			sheetNames = currentFile.data.map((sheet) => sheet.name);

			saveFile(currentFile);
		};
	}

	async function saveFile(data) {
		const dataToSave = compressToUTF16(JSON.stringify(data));
		sendMsgToFigma('save-sheet', dataToSave);
	}

	function handleAssignLabel(e) {
		sendMsgToFigma('assign-layer-name', {
			sheet: e.detail.sheet,
			column: e.detail.column,
			row: e.detail.row,
		});
	}

	function handleApplyData(e) {
		isApplyingData = true;
		sendMsgToFigma('apply-data', currentFile);
		console.time('Elapsed time');
	}

	function formatAndCleanSheet(sheet, sheetName, index) {
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
			name: sheetName,
			header: _sheet[0],
			data: _sheet.slice(1),
		};
	}
</script>

<div class="wrapper">
	<!-- Display the selected sheet data in a table -->
	<main>
		{#if !!currentFile.fileName}
			<header>
				<TabBar
					items={sheetNames}
					activeIndex={currentFile.activeSheet}
					on:click={(e) => (currentFile.activeSheet = e.detail.index)}
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
	</main>
	<footer>
		<!-- File input to upload Excel file -->
		<FileInput
			on:change={handleFileInput}
			fileName={currentFile.fileName}
			lastUpdatedTime={currentFile.date} />
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
		margin-block-end: -0.75rem;
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
		flex-grow: 1;
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
		min-width: 60px;
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

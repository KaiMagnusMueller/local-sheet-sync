import { postMessageToast } from './lib/figma-backend-utils';
import { getLabels, mergeLabels } from './lib/handle-labels';

console.clear();
// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 680, height: 420, themeColors: true });

// Possibly offer this as option
figma.skipInvisibleInstanceChildren = true;
let documentNode = figma.root;

let sheet = documentNode.getPluginData('sheet');
let settings = documentNode.getPluginData('settings');

figma.ui.onmessage = (msg) => {
    switch (msg.type) {
        case 'save-sheet':
            const sheetData = msg.data;
            console.log("Saving sheet data");
            documentNode.setPluginData('sheet', sheetData);
            break;
        case "assign-layer-name":
            const currentSelection = figma.currentPage.selection;
            const newLabels: Labels = msg.data

            // Example name: Label {sheet: 'Kundenliste', column: 'Name', row: 'n'}

            applyLabelsToSelection(currentSelection, newLabels);
            break;
        default:
            break;
    }
};

if (sheet) {
    console.log("Loading sheet data");

    figma.ui.postMessage({
        type: 'restore-sheet',
        data: sheet,
    });
}




function applyLabelsToSelection(currentSelection: readonly SceneNode[], newLabels: Labels) {
    currentSelection.forEach(node => {
        const { existingLabels, nodeName } = getLabels(node.name);
        const mergedLabels = mergeLabels(existingLabels, newLabels);

        if (Object.keys(mergedLabels).length === 0) {
            node.name = nodeName;
        } else {
            const newName = nodeName + " " + JSON.stringify(mergedLabels);
            node.name = newName;
        }
    });
}

figma.on('selectionchange', handleSelectionChange);

function handleSelectionChange() {
    // @ts-ignore
    let currentSelection: Array<SceneNode>;

    try {
        // @ts-ignore
        currentSelection = figma.currentPage.selection;
    } catch (error) {
        postMessageToast('Node is hidden and inacessible to the plugin');
        return;
    }

    figma.ui.postMessage({
        type: 'selection-changed',
        data: currentSelection,
    });
}




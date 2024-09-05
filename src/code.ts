import { postMessageToast } from './lib/figma-backend-utils';
import { getLabels, mergeLabels } from './lib/handle-labels';
import { getAncestorNodeArray, groupNodes } from './lib/node-tree-helpers';

console.clear();
figma.showUI(__html__, { width: 680, height: 420, themeColors: true });

// Possibly offer this as option
figma.skipInvisibleInstanceChildren = true;
let documentNode = figma.root;

let sheet = documentNode.getPluginData('sheet');
// TODO: Add settings
let settings = documentNode.getPluginData('settings');

// ---------------------------------
// ON STARTUP
// ---------------------------------
if (sheet) {
    console.log("Loading sheet data");
    figma.ui.postMessage({
        type: 'restore-sheet',
        data: sheet,
    });
}


// ---------------------------------
// ON PLUGIN MESSAGE
// ---------------------------------
figma.ui.onmessage = (msg) => {
    switch (msg.type) {
        case 'save-sheet':
            const sheetData = msg.data;
            documentNode.setPluginData('sheet', sheetData);

            break;
        case "assign-layer-name":
            const newLabels: Labels = msg.data
            applyLabelsToSelection(figma.currentPage.selection, newLabels);

            break;
        case "apply-data":
            applyDataToSelection(figma.currentPage.selection, msg.data);

            break
        default:
            break;
    }
};


// ---------------------------------
// HANDLE MESSAGES
// ---------------------------------
function applyLabelsToSelection(currentSelection: readonly SceneNode[], newLabels: Labels) {
    currentSelection.forEach(node => {
        const { existingLabels, nodeName } = getLabels(node.name);
        const mergedLabels = mergeLabels(existingLabels, newLabels);

        if (!mergedLabels) {
            node.name = nodeName;
        } else {
            const newName = nodeName + " " + JSON.stringify(mergedLabels);
            node.name = newName;
        }
    });
}


async function applyDataToSelection(currentSelection: readonly SceneNode[], dataToApply) {
    let updatedNodes = 0

    let nodesToSearch: BaseNode[] = [];
    let nodesToApplyData: BaseNode[] = [];


    switch (currentSelection.length) {
        case 0:
            // Search current page if no selection
            figma.currentPage.children.forEach(node => {
                //@ts-ignore
                if (node.findAll !== undefined) {
                    nodesToSearch.push(node);
                } else if (node.name.match(/({.*})/)) {
                    nodesToApplyData.push(node);
                }
            });
            break;
        default:
            currentSelection.forEach(node => {
                //@ts-ignore
                if (node.findAll !== undefined) {
                    nodesToSearch.push(node);
                } else if (node.name.match(/({.*})/)) {
                    nodesToApplyData.push(node);
                }
            });
            break;
    }

    nodesToSearch.forEach(node => {
        //@ts-ignore
        const matchingNodes = node.findAll(node => {
            const match = node.name.match(/({.*})/);
            if (!match) return false;

            try {
                const jsonObject = JSON.parse(match[0]);
                return !!jsonObject.column;
            } catch (error) {
                console.error('Invalid JSON:', error);
                return false;
            }
        });
        nodesToApplyData = nodesToApplyData.concat(matchingNodes);
    });



    await loadFonts(nodesToApplyData);

    const selectedNodesLineage = nodesToApplyData.map(node => { return getAncestorNodeArray([node]) });
    const groupedNodes = groupNodes(selectedNodesLineage);
    console.log("Grouped nodes:", groupedNodes);

    groupedNodes.forEach(group => {
        group.forEach(rootNode => {
            rootNode.childNodes.forEach((node, i) => {
                applyData(node, i, node.labels, dataToApply);
                updatedNodes++;
            });
        });
    });

    console.log("Applied data to", updatedNodes, updatedNodes !== 1 ? "elements" : "element");

    figma.ui.postMessage({
        type: 'done-apply-data',
    });
}


function applyData(node, i: number, labels: Labels, dataToApply) {
    if (!labels.column) {
        return console.log("Node has no column definiton.")
    }

    if (!labels.sheet) {
        console.log("Node has no sheet definition, using default sheet 0");
    }

    const sheetIndex = Math.max(dataToApply.findIndex(e => { return e.name === labels.sheet }), 0);
    const columnIndex = dataToApply[sheetIndex].header.findIndex(e => { return e === labels.column })

    if (sheetIndex < 0) {
        return console.log("Sheet does not exist in imported data. Sheet name:", labels.sheet);
    }
    if (columnIndex < 0) {
        return console.log("Column does not exist in sheet. Sheet name:", labels.sheet, "Column name:", labels.column);

    }

    const sheetDataToApply = dataToApply[sheetIndex].data //2D Array of sheet

    const cellData = sheetDataToApply[i % sheetDataToApply.length][columnIndex]

    // console.log(cellData);

    node.node.characters = cellData.toString();
}


// ---------------------------------
// SELECTION CHANGE EVENT
// ---------------------------------
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

async function loadFonts(nodesToApplyData: BaseNode[]) {
    let fontsToLoad = [];
    nodesToApplyData.forEach((node, i) => {
        if (node.type !== "TEXT") {
            return;
        }

        const fontsInUse = [...node.getRangeAllFontNames(0, node.characters.length)];
        fontsInUse.forEach(fontName => {
            fontsToLoad.some(font => font.family === fontName.family) || fontsToLoad.push(fontName);
        })
    });


    try {
        await Promise.all(fontsToLoad.map(figma.loadFontAsync));
    } catch (error) {
        console.error("Error loading fonts:", error);
    }

    return fontsToLoad;
}
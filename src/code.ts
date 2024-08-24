import { postMessageToast } from './lib/figma-backend-utils';
import { getLabels, mergeLabels } from './lib/handle-labels';
import { uniqObjInArr, getAncestorNodeArray, createDataTree, cleanTree } from './lib/node-tree-helpers';

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

let dataToApply = []


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
            dataToApply = msg.data;
            // console.log(dataToApply);

            applyDataToSelection(figma.currentPage.selection);

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


async function applyDataToSelection(currentSelection: readonly SceneNode[]) {
    let nodesToSearch: BaseNode[] = [];
    let nodesToApplyData: BaseNode[] = [];


    // Search current page if no selection
    if (!currentSelection) {
        console.log("No selection");

        figma.currentPage.children.forEach(node => {
            //@ts-ignore
            if (node.findAll !== undefined) {
                nodesToSearch.push(node);
            } else if (node.name.match(/({.*})/)) {
                nodesToApplyData.push(node);
            }
        })
    }

    // Search selected nodes
    if (currentSelection) {
        console.log("Selection");

        currentSelection.forEach(node => {

            //@ts-ignore
            if (node.findAll !== undefined) {
                nodesToSearch.push(node);
            } else if (node.name.match(/({.*})/)) {
                nodesToApplyData.push(node);
            }
        })
    };

    nodesToSearch.forEach(node => {
        //@ts-ignore
        nodesToApplyData = node.findAll(node => {
            const match = node.name.match(/({.*})/);

            if (match) {
                const jsonString = match[0];
                const jsonObject = JSON.parse(jsonString);
                // existingLabels.sheet = jsonObject.sheet;
                let column = jsonObject.column;
                // existingLabels.row = jsonObject.row;

                if (column) {
                    return true;
                }
            }
            return false;
        });

    })

    await loadFonts(nodesToApplyData);

    const ancestorNodeArray = uniqObjInArr(getAncestorNodeArray(nodesToApplyData), 'id');
    let ancestorTree = createDataTree(ancestorNodeArray);
    ancestorTree.forEach(node => { cleanTree(node) })

    traverseTree(ancestorTree)

    console.log("Finished applying data");
    figma.ui.postMessage({
        type: 'done-apply-data',
    });
}



function traverseTree(nodes, labelsFromParent: Labels = {}) {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        const childNodes = node.childNodes;

        const currentLabels = mergeLabels(labelsFromParent || {}, node.labels, false)

        const nodesToApplyData = childNodes.filter((n) => { return n.type === "TEXT" })


        nodesToApplyData.forEach((n, i) => {
            applyData(n, i, currentLabels)
        });

        traverseTree(childNodes, currentLabels)
    }
}


function applyData(node, i: number, labels: Labels) {
    const currentLabels = mergeLabels(node.labels, labels, false)

    if (!currentLabels.column) {
        return console.log("Node has no column definiton.")
    }
    if (!currentLabels.sheet) {
        console.log("Node has no sheet definition, using default sheet 0");
    }

    const sheetIndex = Math.max(dataToApply.findIndex(e => { return e.name === currentLabels.sheet }), 0);
    const columnIndex = dataToApply[sheetIndex].header.findIndex(e => { return e === currentLabels.column })

    if (sheetIndex < 0) {
        return console.log("Sheet does not exist in imported data. Sheet name:", currentLabels.sheet);
    }
    if (columnIndex < 0) {
        return console.log("Column does not exist in sheet. Sheet name:", currentLabels.sheet, "Column name:", currentLabels.column);
    }

    const cellData = dataToApply[sheetIndex].data[i][columnIndex]

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




function clone(val) {
    const type = typeof val
    if (val === null) {
        return null
    } else if (type === 'undefined' || type === 'number' ||
        type === 'string' || type === 'boolean') {
        return val
    } else if (type === 'object') {
        if (val instanceof Array) {
            return val.map(x => clone(x))
        } else if (val instanceof Uint8Array) {
            return new Uint8Array(val)
        } else {
            let o = {}
            for (const key in val) {
                o[key] = clone(val[key])
            }
            return o
        }
    }
    throw 'unknown'
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

    await Promise.all(
        fontsToLoad.map(figma.loadFontAsync)
    );

    return fontsToLoad;
}
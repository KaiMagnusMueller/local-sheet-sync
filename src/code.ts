import { postMessageToast } from './lib/figma-backend-utils';
import { getAllImmediateChildsWithLabels, getLabels, hasLabels, mergeLabels, stringifyLabels } from './lib/handle-labels';
import { uniqObjInArr, getAncestorNodeArray, createDataTree, cleanTree, groupNodes } from './lib/node-tree-helpers';

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
    console.log(ancestorNodeArray);

    // let ancestorTreeRaw = createDataTree(ancestorNodeArray);
    // let ancestorTree = []
    // ancestorTree = cleanTree(ancestorTreeRaw)
    // console.log(ancestorTree);

    // console.log(getAncestorNodeArray(nodesToApplyData));

    const selectedNodesLineage = nodesToApplyData.map(node => { return getAncestorNodeArray([node]) });
    console.log(selectedNodesLineage);
    const result = groupNodes(selectedNodesLineage);
    console.log(result);




    // ancestorTree.forEach((node, i) => {
    //     recursiveApplyData(node, i);
    // });




    function recursiveApplyData(node, i: number, isLocked?: boolean, parentIndex?: number) {

        console.log("Start:----------------------");
        console.log("Current node:", i, isLocked, parentIndex, node.name);

        let __localIndex = i;

        // if (isLocked) {
        //     __localIndex = parentIndex;
        // }


        if (hasLabels(node.name)) {
            applyData(node, __localIndex, node.labels);
            updatedNodes++;
        }

        let sortedNodes = {};

        node.childNodes.forEach(node => {
            let columnLabel = node.labels?.column || "none";
            if (!sortedNodes[columnLabel]) {
                sortedNodes[columnLabel] = [];
            }
            sortedNodes[columnLabel].push(node);
        });





        // TODO: Check if node is likely parent (for now simply based on having multiple children with same column names, but can be extended in the future)
        // If node is likely parent, increase parent index or create a toggle to lock the current index for the children



    }


    console.log(updatedNodes);

    console.log("Finished applying data");
    figma.ui.postMessage({
        type: 'done-apply-data',
    });
}

let updatedNodes = 0


function applyData(node, i: number, labels: Labels) {
    const currentLabels = labels

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
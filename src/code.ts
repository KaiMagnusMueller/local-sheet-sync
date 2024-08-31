import { postMessageToast } from './lib/figma-backend-utils';
import { getAllImmediateChildsWithLabels, getLabels, hasLabels, mergeLabels, stringifyLabels } from './lib/handle-labels';
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

    // console.log(ancestorNodeArray);

    let ancestorTreeRaw = createDataTree(ancestorNodeArray);

    // console.log(ancestorTreeRaw);
    // console.log("-----end ancestorTreeRaw-----");
    let ancestorTree = []

    ancestorTree = cleanTree(ancestorTreeRaw)

    console.log(ancestorTree);

    ancestorTree.forEach((node, i) => {
        recursiveApplyData(node, i);
    });




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




        function checkUniqueNames(nodes): boolean {
            const nodeColumns = new Set<string>();

            for (const node of nodes) {
                if (node.labels.column && nodeColumns.has(node.labels.column)) {
                    return false;
                }
                nodeColumns.add(node.labels.column);
            }

            return true;
        }


        const nodeIsList = determineIfNodeIsList(node)

        console.log("Node is list:", nodeIsList);



        // TODO: Check if node is likely parent (for now simply based on having multiple children with same column names, but can be extended in the future)
        // If node is likely parent, increase parent index or create a toggle to lock the current index for the children


        // console.log(sortedNodes);

        Object.keys(sortedNodes).forEach((key, j) => {
            sortedNodes[key].forEach((n, k) => {


                let _isLocked = false;
                let localIndex = i;

                if (!checkUniqueNames(getAllImmediateChildsWithLabels(n))) {
                    console.log("Children have duplicate column names");

                    localIndex = k
                } else {
                    _isLocked = true;
                    console.log("Children have unique column names");

                    localIndex = i
                }


                if (isLocked) {
                    _isLocked = true;
                    localIndex = __localIndex
                } else {
                    _isLocked = false;
                    localIndex = k
                }

                console.log("Checking:", k, _isLocked, __localIndex, n.name);




                recursiveApplyData(n, k, _isLocked, __localIndex);
            });
        });



    }


    console.log(updatedNodes);

    console.log("Finished applying data");
    figma.ui.postMessage({
        type: 'done-apply-data',
    });
}

let updatedNodes = 0


function determineIfNodeIsList(node) {
    // const directChilds = node.childNodes.filter(child => child.node.findAllWithCriteria ? true : false);
    const directChilds = node.childNodes


    console.log(directChilds);

    if (directChilds.length <= 0) {
        console.log("Node has no direct children with findAllWithCriteria. This could be because the node is a leaf node, or the children are not searchable, like text nodes.");
        return false
    }

    if (directChilds.length <= 1) {
        console.log("Node has less than 2 direct children with findAllWithCriteria and can therefore not be a list.");
        return false

    }

    let labelsInsideChildNodes = []
    let areAllElementsSame

    directChilds.forEach(child => {
        const childsWithLabels = getAllImmediateChildsWithLabels(child);
        labelsInsideChildNodes.push(childsWithLabels.map((n) => {
            console.log(n);
            console.log(stringifyLabels(n));

            return stringifyLabels(n);
        }));

    });

    console.log("Labels inside child nodes:");

    console.log(labelsInsideChildNodes);

    // TODO: Comparison for the column values doesn't seem to work correctly. The contract list id not idenfified as a list here.

    areAllElementsSame = labelsInsideChildNodes.some(e => e.length === 0) ? false : labelsInsideChildNodes.every((l) => {
        const concatenatedString = l.join('');
        console.log(concatenatedString);
        console.log(labelsInsideChildNodes[0].join(''));



        return concatenatedString === labelsInsideChildNodes[0].join('');
    });

    console.log("Node has multiple children with findAllWithCriteria, and all children have the same labels:", areAllElementsSame);

    // If all elements are the same, iterate over all the children, increment the index and apply the data
    // If they are not the same, dont increment the index for the children.


    return areAllElementsSame;

}


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
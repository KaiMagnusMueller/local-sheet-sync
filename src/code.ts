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

    ancestorTree.forEach(node => { aggregateDataPoints(node) })



    console.log(ancestorTree);
    // traverseTree(ancestorTree);
    ancestorTree.forEach((node, i) => { printLeafNodesWithSameDataPoints(node, {}, i) })




    console.log(updatedNodes);

    console.log("Finished applying data");
    figma.ui.postMessage({
        type: 'done-apply-data',
    });
}

let updatedNodes = 0


function printLeafNodesWithSameDataPoints(node, labelsFromParent: Labels = {}, parentIndex) {
    console.log("   ");
    console.log("   ");
    console.log("Start print leaf------");

    console.log(node);


    const children = node.childNodes;

    // console.log(node);
    const currentLabels = mergeLabels(labelsFromParent || {}, node.labels, false)

    const allChildsHaveEqualDataPoints = children.every(child => child.numberOfDataPoints === children[0].numberOfDataPoints);



    let index

    // if (!allChildsHaveEqualDataPoints) {
    //     return
    // }

    const childrenWithColDef = children.filter(child => child.labels && child.labels.column);
    console.log("childrenWithColDef", childrenWithColDef.length > 0 ? true : false);

    const columnValues = childrenWithColDef.map(n => n.labels.column);
    const uniqueColumnValues = [...new Set(columnValues)];

    const hasListOfValues = uniqueColumnValues.some(arr => arr.length > 1)


    // console.log(childrenWithColDef);

    const nodeHasColDef = node.labels && node.labels.column ? true : false

    if (nodeHasColDef) {
        // index = 0
        // let localIndex = 0


        // if (parentIndex > 1) {
        //     localIndex = parentIndex
        // }

        applyData(node, parentIndex, currentLabels)

    }

    // if (childrenWithColDef.length > 0) {


    //     const columnValues = childrenWithColDef.map(n => n.labels.column);
    //     const uniqueColumnValues = [...new Set(columnValues)];

    //     const sortedArrayByColumns = uniqueColumnValues.map(columnValue => {
    //         return childrenWithColDef.filter(n => n.labels.column === columnValue);
    //     });

    //     // console.log(sortedArrayByColumns);


    //     sortedArrayByColumns.forEach(col => {
    //         col.forEach((n, j) => {
    //             let localIndex = parentIndex


    //             if (col.length > 1) {
    //                 localIndex = currentIndex
    //             } else {
    //                 _parentIndex++

    //             }


    //             // console.log(col.length, localIndex, index, _parentIndex);
    //             // console.log(col.length, localIndex, index, col, n);

    //             applyData(n, localIndex, currentLabels)
    //         });
    //     });

    //     // childrenWithColDef.forEach((child, i) => {
    //     //     applyData(child, index, currentLabels)

    //     // })


    // }

    console.log("ParentIndex:", parentIndex);

    const sortedArrayByColumns = uniqueColumnValues.map(columnValue => {
        return childrenWithColDef.filter(n => n.labels.column === columnValue);
    });



    // sortedArrayByColumns.forEach(col => {
    //     col.forEach((child, i) => {

    //         if (child.childNodes.length) {

    //         }

    //         let indexForChild = i

    //         if ((childrenWithColDef.length > 0) && hasListOfValues) {
    //             indexForChild = parentIndex
    //         }

    //         console.log(indexForChild);
    //         console.log((childrenWithColDef.length > 0), hasListOfValues);

    //         printLeafNodesWithSameDataPoints(child, currentLabels, indexForChild)

    //     });
    // });


    children.forEach((child, i) => {
        if (child.childNodes.length) {

        }

        let indexForChild

        if (!hasListOfValues) {
            indexForChild = i

            console.log("not haslistofvalues");

        } else {
            console.log("yes haslistofvalues");
            indexForChild = parentIndex
        }

        console.log(child.name, indexForChild);



        console.log((childrenWithColDef.length > 0), hasListOfValues);

        printLeafNodesWithSameDataPoints(child, currentLabels, indexForChild)

    })


    // if (node.type !== "PAGE") {

    //     console.log(node);

    //     node.childNodes.forEach((child, j) => {
    //         // console.log(node.name, j);
    //         // traverseTree(child, currentLabels, index)

    //         applyData(child, index, currentLabels)
    //         updatedNodes++

    //         // child.updated = true
    //     })



    // }


}




// const currentLabels = mergeLabels(labelsFromParent || {}, node.labels, false)
// if (node.childNodes && node.childNodes.length > 0) {
//     printLeafNodesWithSameDataPoints(node.childNodes, currentLabels, j);
// } else {
//     j += j
//     const siblings = node.parent?.childNodes || [];
//     const allSiblingsHaveSameDataPoints = siblings.every(sibling => sibling.numberOfDataPoints === node.numberOfDataPoints);
//     if (allSiblingsHaveSameDataPoints) {
//         console.log(node.name);
//         console.log(j);

//         applyData(node, j, currentLabels)
//         console.log("---");

//     }
// }


// let index = 0
function traverseTree(node, labelsFromParent: Labels = {}, i) {
    // console.log("-----------");
    if (node.updated) {
        return
    }

    console.log("Traverse tree:", node.name, i);

    if (node.labels.column) {
        applyData(node, i, labelsFromParent)
    }

    node.childNodes.forEach(child => {
        const currentLabels = mergeLabels(labelsFromParent || {}, node.labels, false)
        traverseTree(child, currentLabels, i)
    })


    // for (let i = 0; i < nodes.length; i++) {
    //     const node = nodes[i]

    //     if (!node.node.findAllWithCriteria) {
    //         continue
    //     }

    //     const childNodes = node.childNodes;

    //     const currentLabels = mergeLabels(labelsFromParent || {}, node.labels, false)

    //     const nodesToApplyData = childNodes.filter((n) => { return n.type === "TEXT" })

    //     const columnValues = nodesToApplyData.map(n => n.labels.column);
    //     const uniqueColumnValues = [...new Set(columnValues)];

    //     const sortedArrayByColumns = uniqueColumnValues.map(columnValue => {
    //         return nodesToApplyData.filter(n => n.labels.column === columnValue);
    //     });

    //     // sortedArrayByColumns.forEach(col => {

    //     //     col.forEach((n, j) => {
    //     //         // index = 0 ? index = j : index = index;
    //     //         // console.log(index);

    //     //         applyData(n, j, currentLabels)
    //     //     });
    //     // });

    //     nodesToApplyData.forEach((n, i) => {
    //         applyData(n, i, currentLabels)
    //     });

    //     // if (sortedArrayByColumns.some(c => c.length === 1)) {
    //     //     index++
    //     // } else {
    //     //     index = 0
    //     // }

    //     traverseTree(childNodes, currentLabels, i)
    // }
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

    const sheetDataToApply = dataToApply[sheetIndex].data //2D Array of sheet

    const cellData = sheetDataToApply[i % sheetDataToApply.length][columnIndex]

    console.log(cellData);

    node.node.characters = cellData.toString();

}


function aggregateDataPoints(node) {
    if ((!node.childNodes || node.childNodes.length === 0) && !node.labels) {
        return node;
    }

    let numberOfDataPoints = node.labels.column ? 1 : 0

    for (const child of node.childNodes) {
        numberOfDataPoints += aggregateDataPoints(child).numberOfDataPoints;
    }

    node.numberOfDataPoints = numberOfDataPoints

    return node;
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
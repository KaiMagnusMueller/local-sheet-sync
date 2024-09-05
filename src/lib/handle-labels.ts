
/**
 * Retrieves all immediate children of a node that have labels.
 *
 * @param {TreeNode} node - The parent node.
 * @returns {TreeNode[]} - An array of immediate children with labels.
 */
export function getAllImmediateChildsWithLabels(node: TreeNode): TreeNode[] {
    return node.childNodes.filter(child => hasLabels(child.name));
}

export function hasLabels(input: string): boolean {
    return input.match(/({.*})/) ? true : false
}

/**
 * Retrieves the existing labels and node name from the given input string.
 * 
 * @param input - The input string containing the labels and node name.
 * @returns An object containing the existing labels and node name.
 */
export function getLabels(input: string): { existingLabels: Labels, nodeName: string } {
    const existingLabels: Labels = {};
    let nodeName = '';

    // Extract JSON object from string
    const match = input.match(/({.*})/);
    if (match) {
        try {
            const jsonObject = JSON.parse(match[0]);
            existingLabels.sheet = jsonObject.sheet;
            existingLabels.column = jsonObject.column;
            existingLabels.row = jsonObject.row;
        } catch (error) {
            console.error('Invalid JSON:', error);
        }
    }

    // Extracting the remaining string
    nodeName = input.replace(/({.*})/, '').trim();

    return { existingLabels, nodeName };
}

export function stringifyLabels(node: BaseNode): string {
    return JSON.stringify(getLabels(node.name).existingLabels);
}

export function mergeLabels(existingLabels: Labels, newLabels: Labels, toggleLabels?: boolean): Labels | undefined {
    // if (!existingLabels && !newLabels) {
    //     // postMessageToast('All labels are empty');
    //     return undefined;
    // }

    // Merge the labels
    const mergedLabels: Labels = {
        sheet: assignLabel(existingLabels?.sheet, newLabels?.sheet, toggleLabels),
        column: assignLabel(existingLabels?.column, newLabels?.column, toggleLabels),
        row: assignLabel(existingLabels?.row, newLabels?.row, toggleLabels),
    };

    // Check if all keys are empty
    const areAllKeysEmpty = Object.values(mergedLabels).every(label => !label);

    if (areAllKeysEmpty) {
        // postMessageToast('All labels are empty');
        return undefined;
    }

    return mergedLabels;
}

export function assignLabel(existing: string, _new: string, toggleLabel = true): string | undefined {
    // If the existing and new label are equal, return undefined to toggle the label off
    if ((existing === _new) && toggleLabel) {
        return undefined;
    }

    // If both labels are empty, keep it undefined
    if (!existing && !_new) {
        return undefined;
    }

    // If the a label exists and the new label is empty, keep the existing label
    if (existing && !_new) {
        return existing;
    }

    // Last case for when the existing label is empty and new label is not empty, create new label
    return _new;
}

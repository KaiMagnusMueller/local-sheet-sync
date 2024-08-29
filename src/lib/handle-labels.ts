import { postMessageToast } from './figma-backend-utils';

export function hasLabels(input: string): boolean {
    return input.match(/({.*})/) ? true : false
}


export function getLabels(input: string): { existingLabels: Labels, nodeName: string } {
    const existingLabels: Labels = {};
    let nodeName = '';

    // Extracting the JSON object from the string
    const match = input.match(/({.*})/);
    if (match) {
        const jsonString = match[0];
        const jsonObject = JSON.parse(jsonString);
        existingLabels.sheet = jsonObject.sheet;
        existingLabels.column = jsonObject.column;
        existingLabels.row = jsonObject.row;
    }

    // Extracting the remaining string
    const remainingString = input.replace(/({.*})/, '').trim();
    nodeName = remainingString;

    return { existingLabels: existingLabels, nodeName };
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

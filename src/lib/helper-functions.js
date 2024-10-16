export function saveRecentSearches(recentSearches) {
    //TODO: is it possible to let a store update the plugindata on its own?
    // @ts-ignore
    parent.postMessage(
        {
            pluginMessage: {
                type: 'update-recent-searches',
                parameters: recentSearches,
            },
        },
        '*'
    );
}

export function saveFilterRanking(filterList) {
    //TODO: is it possible to let a store update the plugindata on its own?
    let _filterList = [];
    filterList.forEach((element) => {
        _filterList.push(_objectWithoutProperties(element, ['checked', 'sticky', 'name']));
    });
    parent.postMessage(
        {
            pluginMessage: {
                type: 'update-filter-ranking',
                parameters: _filterList,
            },
        },
        '*'
    );
    console.log('save filters');
}

function _objectWithoutProperties(obj, keys) {
    var target = {};
    for (var i in obj) {
        if (keys.indexOf(i) >= 0) continue;
        if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
        target[i] = obj[i];
    }
    return target;
}

export function saveSettings(settings) {
    console.log(settings);
    parent.postMessage(
        {
            pluginMessage: {
                type: 'update-settings',
                parameters: settings,
            },
        },
        '*'
    );
    console.log('save settings...');
}

/**
 * Sends a message to the Figma plugin.
 *
 * @param {string} type - The type of the message. Will be used in the backend to determine how the message is handled.
 * @param {any} data - The data to be sent with the message.
 */
export function sendMsgToFigma(type, data = "") {
    parent.postMessage(
        {
            pluginMessage: {
                type: type,
                data: data,
            },
        },
        '*'
    );
}

export function getUint8Array(obj) {
    const array = Object.entries(obj).map(([key, value]) => {
        return value;
    });

    // @ts-ignore
    return URL.createObjectURL(new Blob([new Uint8Array(array).buffer], { type: 'image/png' }));
}

// Component Icons
import AppIcon from '../assets/icons/AppIcon.svg';
import Component from '../assets/icons/NodeTypes/Component.svg';
import ComponentSet from '../assets/icons/NodeTypes/Component.svg';
import BooleanOperation from '../assets/icons/NodeTypes/BooleanOperation.svg';
import Frame from '../assets/icons/NodeTypes/Frame.svg';
import Group from '../assets/icons/NodeTypes/Group.svg';
import Instance from '../assets/icons/NodeTypes/Instance.svg';
import Text from '../assets/icons/NodeTypes/Text.svg';
import Section from '../assets/icons/NodeTypes/Section.svg';
import Connector from '../assets/icons/NodeTypes/Connector.svg';
import Star from '../assets/icons/NodeTypes/Star.svg';
import Slice from '../assets/icons/NodeTypes/Slice.svg';
import Ellipse from '../assets/icons/NodeTypes/Ellipse.svg';
import Page from '../assets/icons/NodeTypes/Page.svg';

export function returnIcon(nodeType) {
    switch (nodeType) {
        case 'INSTANCE':
            return Instance;
        case 'COMPONENT':
            return Component;
        case 'COMPONENT_SET':
            return ComponentSet;
        case 'BOOLEAN_OPERATION':
            return BooleanOperation;
        case 'FRAME':
            return Frame;
        case 'GROUP':
            return Group;
        case 'TEXT':
            return Text;
        case 'SECTION':
            return Section;
        case 'CONNECTOR':
            return Connector;
        case 'STAR':
            return Star;
        case 'SLICE':
            return Slice;
        case 'ELLIPSE':
            return Ellipse;
        case 'PAGE':
            return Page;
        default:
            return AppIcon;
    }
}

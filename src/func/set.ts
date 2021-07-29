/*
 * Copyright (C) 2018  Ben Ockmore
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import * as _ from 'lodash';
import type {FormRelationshipAttributesT as RelationshipAttributeT, SetItemT, Transaction} from './types';

/**
 * Returns a function which compares two object provided to it using the
 * comparison fields mentioned
 * @param  {Array<string>} compareFields - Comparison fields of two objects
 * @returns {Function} - Returns a comparison function
 */
export function getComparisonFunc(compareFields: Array<string>) {
	/**
	 * @param  {any} obj - Object for comparison
	 * @param  {any} other - Object for comparison
	 * @returns {boolean} Boolean value denoting objects are equal on fields
	 */
	return function Cmp(obj: any, other: any): boolean {
		for (const field of compareFields) {
			if (obj[field] !== other[field]) {
				return false;
			}
		}
		return true;
	};
}

/**
 * Get the intersection of two arrays of objects using a custom comparison
 * function. The two arrays represent two versions of a single set - one array
 * is the set before a particular change and the other is the same set after
 * that change.
 *
 * @param {Array<Item>} oldSet - The old array to compare
 * @param {Array<Item>} newSet - The new array to compare
 * @param {Function} comparisonFunc - Function to compare items from the two
 * arrays
 *
 * @returns {Array<Item>} - An array representing the intersection of the two
 * arrays
 */
export function getUnchangedItems<Item extends SetItemT>(
	oldSet: Array<Item>, newSet: Array<Item>,
	comparisonFunc: (obj: Item, other: Item) => boolean
): Array<Item> {
	return _.uniqWith(_.intersectionWith(
		oldSet, newSet, comparisonFunc
	), comparisonFunc);
}

/**
 * Get any items in the new version of the set that aren't present in the old
 * version using a custom comparison function. The two arrays represent two
 * versions of a single set - one array is the set before a particular change
 * and the other is the same set after that change.
 *
 * @param {Array<Item>} oldSet - The old array to compare
 * @param {Array<Item>} newSet - The new array to compare
 * @param {Function} comparisonFunc - Function to compare items from the two
 * arrays
 *
 * @returns {Array<Item>} - An array representing the difference of the two
 * arrays
 */
export function getAddedItems<Item extends SetItemT>(
	oldSet: Array<Item>, newSet: Array<Item>,
	comparisonFunc: (obj: Item, other: Item) => boolean
): Array<Item> {
	return _.uniqWith(_.differenceWith(
		newSet, oldSet, comparisonFunc
	), comparisonFunc);
}

/**
* Get any items in the old version of the set that aren't present in the new
* version using a custom comparison function. The two arrays represent two
* versions of a single set - one array is the set before a particular change
* and the other is the same set after that change.
 *
 * @param {Array<Item>} oldSet - The old array to compare
 * @param {Array<Item>} newSet - The new array to compare
 * @param {Function} comparisonFunc - Function to compare items from the two
 * arrays
 *
 * @returns {Array<Item>} - An array representing the difference of the two
 * arrays
 */
export function getRemovedItems<Item extends SetItemT>(
	oldSet: Array<Item>, newSet: Array<Item>,
	comparisonFunc: (obj: Item, other: Item) => boolean
): Array<Item> {
	return _.uniqWith(_.differenceWith(
		oldSet, newSet, comparisonFunc
	), comparisonFunc);
}

export const removeItemsFromSet = getRemovedItems;

export async function createNewSetWithItems<Item extends SetItemT>(
	orm: any, transacting: Transaction, SetModel: any,
	unchangedItems: Array<Item>, addedItems: Array<Item>,
	itemsAttribute: string, idAttribute = 'id'
): Promise<any> {
	if (!itemsAttribute) {
		throw Error('itemsAttribute must be set in createNewSetWithItems');
	}

	if (_.isEmpty(unchangedItems) && _.isEmpty(addedItems)) {
		return null;
	}

	const newSet = await new SetModel().save(null, {transacting});
	const newSetItemsCollection =
		await newSet.related(itemsAttribute).fetch({transacting});

	const newSetItemsCollectionAttached = await newSetItemsCollection.attach(
		_.map(unchangedItems, idAttribute), {transacting}
	);

	await Promise.all(
		_.map(addedItems, (ident) => newSetItemsCollectionAttached.create(
			_.omit(ident, idAttribute), {transacting}
		))
	);

	return newSet;
}
export async function createNewRelationshipAttributeSetWithItems<Item extends SetItemT>(
	orm: any, transacting: Transaction, SetModel: any,
	unchangedItems: Array<Item>, addedItems: Array<Item>,
	itemsAttribute: string, idAttribute = 'id'
): Promise<any> {
	const {RelationshipAttributeTextValue} = orm;
	if (!itemsAttribute) {
		throw Error('itemsAttribute must be set in createNewRelationshipAttributeSetWithItems');
	}

	if (_.isEmpty(unchangedItems) && _.isEmpty(addedItems)) {
		return null;
	}

	const newSet = await new SetModel().save(null, {transacting});
	const newSetItemsCollection =
		await newSet.related(itemsAttribute).fetch({transacting});

	const newSetItemsCollectionAttached = await newSetItemsCollection.attach(
		_.map(unchangedItems, idAttribute), {transacting}
	);

	await Promise.all(
		_.map(addedItems, async (ident: RelationshipAttributeT) => {
			const model = await newSetItemsCollectionAttached.create(
				_.pick(ident, 'attributeType'), {transacting}
			);
			const {value} = ident;
			await new RelationshipAttributeTextValue({attributeId: model.get('id'), textValue: value.textValue})
				.save(null, {method: 'insert', transacting});
			return model;
		})
	);

	return newSet;
}

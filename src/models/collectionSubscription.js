/*
 * Copyright (C) 2021 Prabal Singh
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

import {camelToSnake, snakeToCamel} from '../util';


export default function collectionSubscription(bookshelf) {
	const CollectionSubscription = bookshelf.Model.extend({
		collection() {
			return this.belongsTo('UserCollection', 'collection_id');
		},
		format: camelToSnake,
		idAttribute: 'id',
		parse: snakeToCamel,
		subscriber() {
			return this.belongsTo('Editor', 'subscriber_id');
		},
		tableName: 'bookbrainz.collection_subscription'
	});

	return bookshelf.model('CollectionSubscription', CollectionSubscription);
}

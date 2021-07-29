/*
 * Copyright (C) 2021  Akash Gupta
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

import bookbrainzData from './bookshelf';
import chai from 'chai';
import {truncateTables} from '../lib/util';


const {expect} = chai;
const {SeriesOrderingType, bookshelf} = bookbrainzData;

describe('SeriesOrderingType model', () => {
	afterEach(
		() => truncateTables(bookshelf, ['bookbrainz.series_ordering_type'])
	);

	it('should return a JSON object with correct keys when saved', async () => {
		const orderTypeData = {
			id: 1,
			label: 'Test Order'
		};

	    const model	= await new SeriesOrderingType(orderTypeData)
			.save(null, {method: 'insert'});
		await model.refresh();
		const orderType = model.toJSON();

		return expect(orderType).to.have.all.keys([
			'id', 'label'
		]);
	});
});

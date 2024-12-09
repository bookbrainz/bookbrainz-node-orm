/*
 * Copied from bookbrainz-site
 * Copyright (C) 2016  Sean Burke
 *               2016  Ben Ockmore
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

/* eslint-disable camelcase */
function getEditorIDByMetaBrainzID(trx, metabrainzUserID) {
	return trx('bookbrainz.editor')
		.select('id')
		.where({metabrainz_user_id: metabrainzUserID})
		.then((rows) => {
			if (rows.length > 0) {
				return rows[0].id;
			}
			return null;
		});
}

function clearEditorByID(trx, editorID) {
	return trx('bookbrainz.editor')
		.where({editor_id: editorID})
		.update({
			area_id: null,
			bio: '',
			cached_metabrainz_name: '<deleted>',
			gender_id: null,
			name: `Deleted Editor #${editorID}`
		});
}

function clearEditorLanguagesByEditorID(trx, editorID) {
	return trx('bookbrainz.editor__language')
		.where({editor_id: editorID})
		.del();
}
/* eslint-enable camelcase */

export function deleteEditorByMetaBrainzID(knex) {
	return (metabrainzUserID) => knex.transaction((trx) => {
		// Fetch user by MetaBrainz ID
		const editorIDPromise =
			getEditorIDByMetaBrainzID(trx, metabrainzUserID);

		return editorIDPromise.then((editorID) => {
			if (editorID === null) {
				return false;
			}

			// Set the editor name to "Deleted Editor #ID"
			// Set cached MetaBrainz name to "<deleted>"
			// Also clear bio, gender, area
			const clearEditorPromise =
				clearEditorByID(trx, editorID);

			// ... and languages
			const clearEditorLanguagesPromise =
				clearEditorLanguagesByEditorID(trx, editorID);

			return Promise.all([clearEditorPromise, clearEditorLanguagesPromise])
				.then(() => true);
		});
	});
}

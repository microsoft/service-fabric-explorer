//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class CollectionUtils {

        /**
         * Update collection by following rules:
         *  - deleting items which are not in new collection
         *  - update item using update delegate
         *  - add new items using create delegate
         * @param collection
         * @param newCollection
         * @param keySelector
         * @param newKeySelector
         * @param create
         * @param update
         */
        public static updateCollection<T, P>(collection: T[], newCollection: P[],
            keySelector: (item: T) => any, newKeySelector: (item: P) => any,
            create: (item: T, newItem: P) => T,
            update: (item: T, newItem: P) => void,
            appendOnly: boolean = false) {

            // create dictionary for old id => element
            let oldCollectionMap = _.keyBy(collection, keySelector);

            // remove deleted items first
            if (!appendOnly) {
                // create dictionary for new id => element
                let newCollectionMap = _.keyBy(newCollection, newKeySelector);
                _.remove(collection, (item) => !newCollectionMap[keySelector(item)]);
            }

            _.forEach(newCollection, (newItem: P) => {
                let id = newKeySelector(newItem);
                let oldItem = oldCollectionMap[id];
                if (oldItem) {
                    // update item
                    update(oldItem, newItem);
                } else if (create) {
                    // add new item
                    collection.push(create(oldItem, newItem));
                }
            });
        }

        /**
         * Returns true if the two collections have the same set of keys.
         * Otherwise false.
         * @param collection
         * @param newCollection
         * @param keySelector
         * @param newKeySelector
         */
        public static compareCollectionsByKeys<T, P>(collection: T[], newCollection: P[],
            keySelector: (item: T) => any, newKeySelector: (item: P) => any) {
            if (collection.length !== newCollection.length) {
                return false;
            }

            let oldCollectionMap = _.keyBy(collection, keySelector);

            return _.every(newCollection, item => {
                let id = newKeySelector(item);
                return !!oldCollectionMap[id];
            });
        }

        /**
         * Update DataModelCollection
         * @param collection
         * @param newCollection
         */
        public static updateDataModelCollection<T>(collection: IDataModel<T>[], newCollection: IDataModel<T>[], appendOnly: boolean = false) {
            CollectionUtils.updateCollection(collection, newCollection, item => item.uniqueId, item => item.uniqueId, (item, newItem) => newItem, (item, newItem) => item.update(newItem.raw), appendOnly);
        }
    }

}

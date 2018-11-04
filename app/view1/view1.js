'use strict';

angular.module('myApp.view1', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/view1', {
            templateUrl: 'view1/view1.html',
        });
    }])
    .factory('changeSnapshotter', [function () {
        const generateSnapshotId = (() => {
            let id = 0;

            return () => {
                return id++;
            };
        })();

        /*
          state - {Object|Array} - anything
          [options] - {
            checkFields: string []
            deepChecking: boolean
            ignoreFields: string []

        */

        const makeSnapshot = (state, options) => {
            const snapshot = state;
            let checkFields, deepChecking, ignoreFields;

            if (options) {
                checkFields = options.checkFields;
                deepChecking = options.deepChecking;
                ignoreFields = options.ignoreFields;
            }

            const bothHaveSameType = (snapshotState, comparedState) => {
                return typeof snapshotState === typeof comparedState;
            };

            const haveProp = (obj, prop) => {
                return obj && obj[prop];
            };

            const bothHaveField = (snapshotState, comparedState, field) => {
                return _.every([snapshotState, comparedState], (obj) => haveProp(obj, field));
            };

            const someIsObject = (...params) => {
                return _.some(params, _.isObject);
            };

            const getKeysOf = (...objs) => {
                if (_.isArray(checkFields)) {
                    return checkFields;
                }

                const keys = _.uniq(_.reduce(objs, (memo, obj) => {
                    memo = _.concat(memo, _.keys(obj));

                    return memo;
                }, []));

                if (_.isArray(ignoreFields)) {
                    return _.without(keys, ignoreFields);
                }

                return keys;
            };

            const isEqualFields = (snapshotState, comparedState, field) => {
                return _.isEqual(snapshotState[field], comparedState[field]);
            };

            const isEqualDeep = (objA, objB) => {
                return _.reduce(getKeysOf(objA, objB), (memo, key) => {

                    if (memo) {
                        const valueA = objA && objA[key];
                        const valueB = objB && objB[key];

                        if (someIsObject(valueA, valueB)) {
                            return isEqualDeep(valueA, valueB);
                        }

                        return valueA === valueB;
                    }

                    return memo;
                }, true);
            };

            const getChanges = (objA, objB) => {
                const changes = {};

                return _.reduce(getKeysOf(objA, objB), (memo, key) => {
                    if (bothHaveField(objA, objB, key)) {
                        const valueA = objA && objA[key];
                        const valueB = objB && objB[key];

                        if (isEqualFields(objA, objB, key)) {
                            return memo;
                        }

                        if (someIsObject(valueA, valueB)) {
                            memo[key] = getChanges(valueA, valueB);

                            return memo;
                        }

                        memo[key] = {
                            oldValue: objA[key],
                            newValue: objB[key]
                        };
                    } else {
                        memo[key] = {
                            oldValue: objA ? objA[key] : objA,
                            newValue: objB ? objB[key] : objB
                        };
                    }

                    return memo;
                }, changes);
            };

            const deepComparing = (snapshotState, comparedState) => {
                if (bothHaveSameType(snapshotState, comparedState)) {
                    return isEqualDeep(snapshotState, comparedState);
                }

                console.error(`Snapshot and compared object have different types`);

                return false;
            };

            const compareWithGroup = (...group) => {
                if (!_.isArray(group)) {
                    console.error(`group should be Array. Passed ${group}`);
                    return;
                }

                return _.every(group, item => isEqualDeep(snapshot, item));
            };

            const diveInField = (obj, fields, idx = 0) => {
                const fieldName = fields[idx];

                if (_.isArray(obj) && /\[n\]/.test(fieldName)) {
                    ++idx;

                    _.each(obj, objValue => {
                        diveInField(objValue, fields, idx);
                    });

                    return;
                }

                if (haveProp(obj, fieldName)) {
                    if (fields.length === (idx + 1)) {
                        delete obj[fieldName];
                        return;
                    }

                    const nextObj = obj[fieldName];

                    diveInField(nextObj, fields, ++idx);
                }
            };

            const getIgnoredFieldsArr = (ignoredFields) => {
                return _.map(ignoredFields, field => {
                    if (_.isString(field)) {
                        const dotReplaced = field
                            .replace(/s/g, '')
                            .replace(/(\[n\])/g, '.$1.')
                            .split('.');

                        return _.filter(dotReplaced, item => !_.isEmpty(item));
                    }

                    console.error(`Expected Array of strings in "ignoredFields" field. Received: ${field}`);
                });
            };

            const getObjExcludingIgnoredFields = (snapshotState, comparedState, ignoredFields) => {
                const fields = getIgnoredFieldsArr(ignoredFields);

                const cloneSnapshot = _.cloneDeep(snapshotState);
                const cloneCompared = _.cloneDeep(comparedState);

                _.each(fields, fieldConstruction => {
                    diveInField(cloneSnapshot, fieldConstruction);
                    diveInField(cloneCompared, fieldConstruction);
                });

                console.log(cloneSnapshot, cloneCompared);

                return deepComparing(cloneSnapshot, cloneCompared);

            };

            const compareWith = (obj) => {
                if (_.isArray(snapshot) && _.isArray(obj)) {
                    return compareWithGroup(obj);
                }
            };

            const getChangedValues = (comparedState) => {
                return getChanges(snapshot, comparedState);
            };

            return {
                compareWith,
                compareWithGroup,
                getChangedValues,
                getObjExcludingIgnoredFields
            };
        };

        return {
            makeSnapshot
        };
    }])

    .controller('View1Ctrl', ['changeSnapshotter', function (snapshotter) {
        const state = {
            a: {
                b: 10,
                c: 20
            },
            d: 30,
            e: {
                f: {
                    j: 40
                },
                j: 50
            }
        };

        const comparedState = {
            a: {
                b: 10,
                c: 20
            },
            d: 30,
            e: {
                f: {
                    j: 40
                },
                j: 50
            }
        };
        const snapshot = snapshotter.makeSnapshot(state);
        window.snapshotter = snapshotter;
    }]);
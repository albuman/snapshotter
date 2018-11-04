'use strict';

describe('myApp.view1 module', function () {
    let snapshotter;
    beforeEach(module('myApp.view1'));

    beforeEach(function() {
        inject(function($injector) {
            snapshotter = $injector.get('changeSnapshotter');
        });
    });
    describe('snapshotter service', function () {

        it('should be equal', inject(function ($controller) {
            //spec body
            var view1Ctrl = $controller('View1Ctrl');
            expect(view1Ctrl).toBeDefined();
        }));

    });
});
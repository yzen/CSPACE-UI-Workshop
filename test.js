/*global jqUnit, jQuery, fluid, start, stop, ok, expect*/
"use strict";

var Tests = function ($) { 
    
    var workshopTests = new jqUnit.TestCase("Workshop Tests");
    
    workshopTests.test("Test 1", function () {
        ok(true, "This is test skeleton.");
    });
};

(function () {
    Tests(jQuery);
}());
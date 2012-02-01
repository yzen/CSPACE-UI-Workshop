/*global jqUnit, jQuery, fluid, start, stop, ok, expect*/
"use strict";

var Tests = function ($) { 

    fluid.registerNamespace("test");
    fluid.setLogging(false);
    
    var workshopTests = new jqUnit.TestCase("Workshop Tests");
    
    workshopTests.test("Test Little Component", function () {
        fluid.defaults("test.littleComponent", {
            gradeNames: ["fluid.littleComponent", "autoInit"],
            someField: "this is a test field"
        });
        
        var littleComponent1 = test.littleComponent(),
            littleComponent2 = test.littleComponent({
                someField: "test field is modified"
            });
        
        // Little Component is a simplest container of fields and methods.
        jqUnit.assertEquals("After creating a little component the option should be", 
            "this is a test field", littleComponent1.options.someField);
        jqUnit.assertEquals("After creating a little component the option should be", 
            "test field is modified", littleComponent2.options.someField);
    });
    
    workshopTests.test("Test Model Component", function () {
        fluid.defaults("test.modelComponent", {
            gradeNames: ["fluid.modelComponent", "autoInit"]
        });
        
        var modelComponent1 = test.modelComponent(),
            modelComponent2 = test.modelComponent({
                model: {
                    field: "Hi, I am a field in the model"
                }
            });
        
        // Model component automatically initializes its model and applier.
        jqUnit.assertDeepEq("After creating a model component the model should be", 
            {}, modelComponent1.model);
        jqUnit.assertDeepEq("After creating a model component the option should be", {
            field: "Hi, I am a field in the model"
        }, modelComponent2.model);
        
        // Changed to the model MUST be performed through the applier (via change request). This will
        // allow for modelChanged events notifications. It will also keep the model and the applier in sync.
        modelComponent1.applier.requestChange("field", "Hi, I am a new field in the model");
        jqUnit.assertDeepEq("After creating a model component the model should be", {
            field: "Hi, I am a new field in the model"
        }, modelComponent1.model);
    });
};

(function () {
    Tests(jQuery);
}());
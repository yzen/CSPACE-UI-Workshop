/*global jqUnit, jQuery, fluid, start, stop, ok, expect*/
"use strict";

var Tests = function ($) { 

    fluid.registerNamespace("test");
    fluid.setLogging(false);

    var workshopTests = new jqUnit.TestCase("Workshop Tests");

    //////////////////////// LITTLE COMPONENT ///////////////////////////

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

    //////////////////////// MODEL COMPONENT ///////////////////////////

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

    //////////////////////// EVENTED COMPONENT ///////////////////////////

    workshopTests.test("Test Evented Component", function () {

        expect(4);

        fluid.defaults("test.eventedComponent", {
            gradeNames: ["fluid.eventedComponent", "autoInit"],
            events: {
                someEvent: null
            },
            listeners: {} // optional
        });

        var eventHandler = function () {
            ok("someEvent fired", true);
        };

        var eventedComponent1 = test.eventedComponent({
                listeners: {
                    someEvent: eventHandler
                }
            }),
            eventedComponent2 = test.eventedComponent({
                events: {
                    newEvent: null
                }
            });

        // Evented component automatically initializes its events and listeners.
        jqUnit.assertValue("After creating an evented component the component should have events initialized",
            eventedComponent1.events.someEvent);
        jqUnit.assertTrue("After creating an evented component the component should have events initialized",
            !!eventedComponent2.events.someEvent && !!eventedComponent2.events.newEvent);

        eventedComponent1.events.someEvent.fire();

        eventedComponent2.events.newEvent.addListener(function () {
            ok("newEvent fired", true);
        });
        eventedComponent2.events.newEvent.fire();
    });

    //////////////////////// VIEW COMPONENT ///////////////////////////

    workshopTests.test("Test View Component", function () {
        fluid.defaults("test.viewComponent", {
            gradeNames: ["fluid.viewComponent", "autoInit"],
            selectors: {
                internal: ".internal-selector"
            }
        });

        var viewComponent = test.viewComponent(".view-component"),
            internal = viewComponent.locate("internal");

        // View Component automatically initializes its dome binder.
        jqUnit.assertEquals("Selectors should be found", 1, internal.length);

        internal.hide();
        jqUnit.assertTrue("Selector is now hidden", internal.is(":hidden"));
    });

    //////////////////////// RENDERER COMPONENT ///////////////////////////

    workshopTests.test("Test Renderer Component", function () {
        fluid.defaults("test.rendererComponent", {
            gradeNames: ["fluid.rendererComponent", "autoInit"],
            selectors: {
                internal: ".internal-selector"
            },
            model: {
                someField: "VALUE"
            },
            protoTree: {
                internal: "${someField}"
            },
            renderOnInit: true
        });

        var rendererComponent = test.rendererComponent(".renderer-component"),
            internal = rendererComponent.locate("internal");

        // Renderer Component automatically renders automatically if renderOnInit is set to true.
        jqUnit.assertEquals("Internal selector should be rendered", "VALUE", internal.val());

        rendererComponent.applier.requestChange("someField", "NEW VALUE");
        rendererComponent.refreshView();
        internal = rendererComponent.locate("internal");
        jqUnit.assertEquals("Internal selector should be updagted", "NEW VALUE", internal.val());

        // Data binding
        internal.val("NEWER VALUE").change();
        jqUnit.assertEquals("Model should be updagted", "NEWER VALUE", rendererComponent.model.someField);
    });

    //////////////////////// SUBCOMPONENTS ///////////////////////////

    workshopTests.test("Test Subcomponent", function () {
        fluid.defaults("test.littleComponentParent", {
            gradeNames: ["fluid.littleComponent", "autoInit"],
            someField: "this is a test field",
            someField2: "this is a test field 2",
            components: {
                subcomponent: {
                    type: "test.littleComponent",
                    options: {
                        field: "{test.littleComponentParent}.options.someField"
                    }
                }
            }
        });

        var littleComponentParent = test.littleComponentParent();

        // Subcomponents are automatically initialized during parent component creation.
        jqUnit.assertValue("After creating a parent component the subcomponents should be created too",
            littleComponentParent.subcomponent);
        jqUnit.assertEquals("Option should be correctly passed to subcomponent",
            littleComponentParent.options.someField, littleComponentParent.subcomponent.options.field);
    });

    //////////////////////// INVERSION OF CONTROL ///////////////////////////

    workshopTests.test("Test Inversion of Control", function () {
        fluid.demands("test.littleComponent", "test.littleComponentParent", {
            options: {
                field: "{test.littleComponentParent}.options.someField2"
            }
        });

        var littleComponentParent = test.littleComponentParent();

        // If component has previously registered demands and the context matches, the depamds block will
        // be also used during options merging.
        jqUnit.assertEquals("Option should be correctly passed to subcomponent from demands",
            littleComponentParent.options.someField2, littleComponentParent.subcomponent.options.field);
    });

    //////////////////////// INVOKERS ///////////////////////////
    workshopTests.test("Test Invokers", function () {
        fluid.defaults("test.componentWithInvoker", {
            gradeNames: ["fluid.littleComponent", "autoInit"],
            someField: "HELLO",
            invokers: {
                basicInvoker1: {
                    funcName: "test.componentWithInvoker.basicInvoker1",
                    args: ["{test.componentWithInvoker}.options.someField"]
                },
                basicInvoker2: "test.componentWithInvoker.basicInvoker2"
            }
        });

        test.componentWithInvoker.basicInvoker1 = function (field) {
            return field + ": this is test.componentWithInvoker.basicInvoker1";
        };

        fluid.demands("test.componentWithInvoker.basicInvoker2", "test.componentWithInvoker", {
            funcName: "test.componentWithInvoker.basicInvoker1",
            args: ["{test.componentWithInvoker}.options.someField"]
        });

        var componentWithInvoker = test.componentWithInvoker();

        // Invokers are automatically created during component initialization. Demands for invokers
        // are resolved on initialization but actual arguments are evaluated every time
        // the invoker is called.
        jqUnit.assertEquals("Correct invoker is initialized",
            "HELLO: this is test.componentWithInvoker.basicInvoker1", componentWithInvoker.basicInvoker1());
        jqUnit.assertEquals("Correct demands resolution for an invoker",
            "HELLO: this is test.componentWithInvoker.basicInvoker1", componentWithInvoker.basicInvoker2());
    });

    //////////////////////// LIFECYCLE FUNCTIONS ///////////////////////////

    workshopTests.test("Test Inversion of Control", function () {
        fluid.defaults("test.lifecycleFunctionsComponent", {
            gradeNames: ["fluid.littleComponent", "autoInit"],
            preInitFunction: "test.lifecycleFunctionsComponent.preInit",
            postInitFunction: "test.lifecycleFunctionsComponent.postInit",
            finalInitFunction: "test.lifecycleFunctionsComponent.finalInit"
        });

        test.lifecycleFunctionsComponent.preInit = function (that) {
            that.preInitOption = "pre";
        };

        test.lifecycleFunctionsComponent.postInit = function (that) {
            that.postInitOption = "post";
        };

        test.lifecycleFunctionsComponent.finalInit = function (that) {
            that.finalInitOption = "final";
        };

        var lifecycleFunctionsComponent = test.lifecycleFunctionsComponent();

        // Autoinit component will execute all lifecycle functions specified.
        fluid.each(["pre", "post", "final"], function (cycle) {
            jqUnit.assertEquals("Option should be set in the right lifecycle function", cycle,
                lifecycleFunctionsComponent[cycle + "InitOption"]);
        });
    });
};

(function () {
    Tests(jQuery);
}());
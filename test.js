/*global jqUnit, jQuery, fluid, start, stop, ok, expect*/
"use strict";

var Tests = function ($) { 

    fluid.registerNamespace("test");
    fluid.setLogging(false);

    var workshopTests = new jqUnit.TestCase("Workshop Tests");

    //////////////////////// LITTLE COMPONENT ///////////////////////////

    fluid.defaults("test.littleComponent", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        someField: "this is a test field"
    });

    workshopTests.test("Test Little Component", function () {
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

    fluid.defaults("test.modelComponent", {
        gradeNames: ["fluid.modelComponent", "autoInit"]
    });

    workshopTests.test("Test Model Component", function () {
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

    fluid.defaults("test.eventedComponent", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        events: {
            someEvent: null
        },
        listeners: {} // optional
    });

    workshopTests.test("Test Evented Component", function () {

        expect(4);

        var eventHandler = function () {
            jqUnit.assert("someEvent fired");
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
            eventedComponent2.events.someEvent && eventedComponent2.events.newEvent);

        eventedComponent1.events.someEvent.fire();

        eventedComponent2.events.newEvent.addListener(function () {
            jqUnit.assert("newEvent fired");
        });
        eventedComponent2.events.newEvent.fire();
    });

    //////////////////////// VIEW COMPONENT ///////////////////////////

    fluid.defaults("test.viewComponent", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        selectors: {
            internal: ".internal-selector"
        }
    });

    workshopTests.test("Test View Component", function () {

        var viewComponent = test.viewComponent(".view-component"),
            internal = viewComponent.locate("internal");

        // View Component automatically initializes its dome binder.
        jqUnit.assertEquals("Selectors should be found", 1, internal.length);

        internal.hide();
        jqUnit.assertTrue("Selector is now hidden", internal.is(":hidden"));
    });

    //////////////////////// RENDERER COMPONENT ///////////////////////////

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

    workshopTests.test("Test Renderer Component", function () {
        var rendererComponent = test.rendererComponent(".renderer-component"),
            internal = rendererComponent.locate("internal");

        // Renderer Component automatically renders automatically if renderOnInit is set to true.
        jqUnit.assertEquals("Internal selector should be rendered", "VALUE", internal.val());

        rendererComponent.applier.requestChange("someField", "NEW VALUE");
        rendererComponent.refreshView();
        internal = rendererComponent.locate("internal");
        jqUnit.assertEquals("Internal selector should be updated", "NEW VALUE", internal.val());

        // Data binding
        internal.val("NEWER VALUE").change();
        jqUnit.assertEquals("Model should be updated", "NEWER VALUE", rendererComponent.model.someField);
    });

    //////////////////////// SUBCOMPONENTS ///////////////////////////

    fluid.defaults("test.littleComponentParent", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        someField: "this is a test field",
        someField2: "this is a test field 2",
        events: {
            createSubcomponent: null
        },
        components: {
            subcomponent: {
                type: "test.littleComponent",
                options: {
                    field: "{test.littleComponentParent}.options.someField"
                }
            },
            subcomponentOnEvent: {
                type: "test.littleComponent",
                createOnEvent: "createSubcomponent"
            }
        }
    });

    workshopTests.test("Test Subcomponent", function () {
        var littleComponentParent = test.littleComponentParent();

        // Subcomponents are automatically initialized during parent component creation.
        jqUnit.assertValue("After creating a parent component the subcomponents should be created too",
            littleComponentParent.subcomponent);
        jqUnit.assertEquals("Option should be correctly passed to subcomponent",
            littleComponentParent.options.someField, littleComponentParent.subcomponent.options.field);
        jqUnit.assertUndefined("subcomponentOnEvent should not be initialized until createSubcomponent event is fired",
            littleComponentParent.subcomponentOnEvent);
        littleComponentParent.events.createSubcomponent.fire();
        jqUnit.assertValue("subcomponentOnEvent should now be initialized", littleComponentParent.subcomponentOnEvent);
    });

    //////////////////////// INVERSION OF CONTROL ///////////////////////////

    fluid.defaults("test.littleComponentParent2", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        someField: "this is a test field",
        someField2: "this is a test field 2",
        components: {
            subcomponent: {
                type: "test.littleComponent",
                options: {
                    field: "{test.littleComponentParent2}.options.someField"
                }
            }
        }
    });

    fluid.defaults("test.littleComponentGrandParent", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        someField: "this is a grandparent test field",
        components: {
            subcomponent: {
                type: "test.littleComponentParent2"
            }
        }
    });

    fluid.demands("test.littleComponent", "test.littleComponentParent2", {
        options: {
            field: "{test.littleComponentParent2}.options.someField2"
        }
    });

    fluid.demands("test.littleComponent", ["test.littleComponentParent2", "test.littleComponentGrandParent"], {
        options: {
            field: "{test.littleComponentGrandParent}.options.someField"
        }
    });

    workshopTests.test("Test Inversion of Control", function () {
        var littleComponentParent2 = test.littleComponentParent2(),
            littleComponentGrandParent = test.littleComponentGrandParent();

        // If component has previously registered demands and the context matches, the depamds block will
        // be also used during options merging.
        jqUnit.assertEquals("Option should be correctly passed to subcomponent from demands",
            littleComponentParent2.options.someField2, littleComponentParent2.subcomponent.options.field);
        jqUnit.assertEquals("Option should be correctly passed to ancestor component from demands",
            littleComponentGrandParent.options.someField, littleComponentGrandParent.subcomponent.subcomponent.options.field);
    });

    //////////////////////// EVENT BOILING //////////////////////////

    fluid.defaults("test.oldEventedComponent", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        events: {
            oldEvent: null
        }
    });

    fluid.defaults("test.myAwesomeComponent", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        events: {
            myAwesomeEvent: null
        },
        components: {
            oldEC: {
                type: "test.oldEventedComponent",
                options: {
                    listeners: {
                        oldEvent: "{test.myAwesomeComponent}.events.myAwesomeEvent"
                    }
                }
            }
        }
    });

    fluid.demands("oldEvent", ["test.oldEventedComponent", "test.myAwesomeComponent"], [
        "{oldEC}"
    ]);

    fluid.defaults("test.eventedComponent2", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        events: {
            someEvent: null,
            someOtherEvent: null,
            localEvent: null,
            parentEvent: null,
            boiledLocal: {
                event: "localEvent"
            }
        },
        field: "EC2 OPTION",
        listeners: {
            someEvent: {
                listener: "{test.eventedComponent2}.events.someOtherEvent",
                args: ["{test.eventedComponent2}.options.field", "{arguments}.0"]
            }
        },
        components: {
            eventBinderParent: {
                type: "test.eventBinderParent"
            }
        }
    });

    fluid.defaults("test.eventBinderParent", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        preInitFunction: "test.eventBinderParent.preInit",
        events: {
            boiledParent: {
                event: "{test.eventedComponent2}.events.parentEvent",
                args: [
                    "{test.eventedComponent2}.options.field",
                    "{arguments}.0"
                ]
            }
        },
        components: {
            eventBinder: {
                type: "test.eventedParent.eventBinder"
            }
        }
    });

    test.eventBinderParent.preInit = function (that) {
        that.handler = function () {
            jqUnit.assert("Event boiling works correctly.");
        };
    };

    fluid.demands("boiledLocal", "test.eventedComponent2", [
        "{test.eventedComponent2}.options.field",
        "{arguments}.0"
    ]);

    fluid.demands("test.eventedParent.eventBinder", ["test.eventBinderParent", "test.eventedComponent2"], {
        options: {
            listeners: {
                "{test.eventedComponent2}.events.someEvent": "{test.eventBinderParent}.handler"
            }
        }
    });

    fluid.defaults("test.eventedParent.eventBinder", {
        gradeNames: ["autoInit", "fluid.eventedComponent"]
    });

    workshopTests.test("Test Event Boiling", function () {
        expect(/*14*/12);
        var eventedComponent2 = test.eventedComponent2(),
            eventArg = "This is an event argument",
            oldEventedComponent = test.oldEventedComponent(),
            myAwesomeComponent = test.myAwesomeComponent();

        // Listeners should be executed with correct arguments passed.
        eventedComponent2.events.someEvent.addListener(function (arg) {
            jqUnit.assertEquals("Argument was passed correctly", eventArg, arg);
        });
        eventedComponent2.events.someOtherEvent.addListener(function () {
            jqUnit.assertEquals("Argument 1 was passed correctly", eventedComponent2.options.field, arguments[0]);
            jqUnit.assertEquals("Argument 2 was passed correctly", eventArg, arguments[1]);
        });
        eventedComponent2.events.someEvent.fire(eventArg);

        eventedComponent2.events.boiledLocal.addListener(function () {
            jqUnit.assertEquals("Argument 1 was passed correctly", eventedComponent2.options.field, arguments[0]);
            jqUnit.assertEquals("Argument 2 was passed correctly", eventArg, arguments[1]);
        });
        eventedComponent2.events.localEvent.fire(eventArg);
        eventedComponent2.events.boiledLocal.fire(eventArg);

        eventedComponent2.eventBinderParent.events.boiledParent.addListener(function () {
            jqUnit.assertEquals("Argument 1 was passed correctly", eventedComponent2.options.field, arguments[0]);
            jqUnit.assertEquals("Argument 2 was passed correctly", eventArg, arguments[1]);
        });
        eventedComponent2.events.parentEvent.fire(eventArg);
/*         eventedComponent2.eventBinderParent.events.boiledParent.fire(eventArg); */

        oldEventedComponent.events.oldEvent.addListener(function (oldArg) {
            jqUnit.assertEquals("Correct argument", "OldArgument", oldArg);
        });
        oldEventedComponent.events.oldEvent.fire("OldArgument");

        myAwesomeComponent.events.myAwesomeEvent.addListener(function (comp) {
            jqUnit.assertEquals("Custom argument is passed correctly", myAwesomeComponent.oldEC, comp);
        });
        myAwesomeComponent.oldEC.events.oldEvent.fire("OldArgument");
    });

    //////////////////////// INVOKERS ///////////////////////////

    fluid.defaults("test.componentWithInvoker", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        someField: "HELLO",
        components: {
            child: {
                type: "test.littleComponent"
            }
        },
        invokers: {
            basicInvoker1: {
                funcName: "test.componentWithInvoker.basicInvoker1",
                args: ["{test.componentWithInvoker}.options.someField"]
            },
            basicInvoker2: "test.componentWithInvoker.basicInvoker2",
            invokerWithArguments: {
                funcName: "test.componentWithInvoker.basicInvoker1",
                args: ["{arguments}.0"]
            },
            invokerAndIOC: {
                funcName: "test.componentWithInvoker.basicInvoker1",
                args: ["{child}.options.someField"]
            }
        }
    });

    fluid.demands("test.componentWithInvoker.basicInvoker2", "test.componentWithInvoker", {
        funcName: "test.componentWithInvoker.basicInvoker1",
        args: ["{test.componentWithInvoker}.options.someField"]
    });

    workshopTests.test("Test Invokers", function () {
        test.componentWithInvoker.basicInvoker1 = function (field) {
            return field + ": this is test.componentWithInvoker.basicInvoker1";
        };

        var componentWithInvoker = test.componentWithInvoker();

        // Invokers are automatically created during component initialization. Demands for invokers
        // are resolved on initialization but actual arguments are evaluated every time
        // the invoker is called.
        jqUnit.assertEquals("Correct invoker is initialized",
            "HELLO: this is test.componentWithInvoker.basicInvoker1", componentWithInvoker.basicInvoker1());
        jqUnit.assertEquals("Correct demands resolution for an invoker",
            "HELLO: this is test.componentWithInvoker.basicInvoker1", componentWithInvoker.basicInvoker2());
        jqUnit.assertEquals("Correct initialization of an invoker with arguments",
            "I AM AN ARGUMENT: this is test.componentWithInvoker.basicInvoker1", componentWithInvoker.invokerWithArguments("I AM AN ARGUMENT"));
        jqUnit.assertEquals("Correct initialization of an invoker and arguments resolvable through IOC",
            "this is a test field: this is test.componentWithInvoker.basicInvoker1", componentWithInvoker.invokerAndIOC());
    });

    //////////////////////// LIFECYCLE FUNCTIONS ///////////////////////////

    fluid.defaults("test.lifecycleFunctionsComponent", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        preInitFunction: "test.lifecycleFunctionsComponent.preInit",
        postInitFunction: "test.lifecycleFunctionsComponent.postInit",
        finalInitFunction: "test.lifecycleFunctionsComponent.finalInit"
    });

    workshopTests.test("Test Inversion of Control", function () {
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
const widgetsPage = require("../../../../../locators/Widgets.json");
const testdata = require("../../../../../fixtures/testdata.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Video Widget Functionality", function () {
  before(() => {
    cy.fixture("videoWidgetDsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. Video Widget play functionality validation", function () {
    cy.openPropertyPane("videowidget");
    cy.widgetText(
      "Video1",
      widgetsPage.videoWidget,
      widgetsPage.widgetNameSpan,
    );
    cy.getAlert("onPlay", "Play success");
    cy.get(widgetsPage.autoPlay).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    /*
    cy.wait(4000);
    cy.get(commonlocators.toastMsg).should("be.visible");
    cy.get(commonlocators.toastMsg).contains("Play success");
    */
  });

  it("2. Video widget pause functionality validation", function () {
    cy.getAlert("onPause", "Pause success");
    cy.get(widgetsPage.autoPlay).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    /*
    cy.wait(4000);
    cy.get(commonlocators.toastMsg).should("be.visible");
    cy.get(commonlocators.toastMsg).contains("Pause success");
    */
  });

  it("3. Update video url and check play and pause functionality validation", function () {
    cy.testCodeMirror(testdata.videoUrl);
    cy.get(".CodeMirror textarea").first().blur();
    cy.get(widgetsPage.autoPlay).click({ force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    /*
    cy.wait(4000);
    cy.get(commonlocators.toastMsg).should("be.visible");
    cy.get(commonlocators.toastMsg).contains("Play success");
    */
    cy.get(widgetsPage.autoPlay).click({ force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    /*
    cy.wait(4000);
    cy.get(commonlocators.toastMsg).should("be.visible");
    cy.get(commonlocators.toastMsg).contains("Pause success");
    */
  });

  it("4. Checks if video widget is reset on button click", function () {
    cy.testCodeMirror(testdata.videoUrl2);
    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 300 });
    cy.openPropertyPane("buttonwidget");
    cy.widgetText(
      "Button1",
      widgetsPage.buttonWidget,
      widgetsPage.widgetNameSpan,
    );
    cy.selectResetWidget("onClick");
    cy.selectWidgetForReset("Video1");

    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", `{{Video1.playState}}`);

    cy.openPropertyPane("videowidget");
    cy.get(widgetsPage.autoPlay).click({ force: true });
    // Wait time added, allowing a second to pass between playing and pausing the widget, before it is reset to zero
    cy.wait(1000);
    cy.get(widgetsPage.autoPlay).click({ force: true });
    cy.get(widgetsPage.widgetBtn).click({ force: true });
    cy.wait(1000);
    cy.get(`${widgetsPage.videoWidget} video`).then(($video) => {
      const video = $video.get(0);
      expect(video.currentTime).to.equal(0);
    });
    cy.get(".t--widget-textwidget").should("contain", "NOT_STARTED");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
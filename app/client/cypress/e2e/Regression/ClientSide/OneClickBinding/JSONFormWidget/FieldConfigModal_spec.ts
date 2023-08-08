import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import { OneClickBinding } from "../spec_utility";
import {
  agHelper,
  entityExplorer,
  dataSources,
  draggableWidgets,
  assertHelper,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

const oneClickBinding = new OneClickBinding();

describe("JSONForm widget one click binding feature", () => {
  it("tests select/unselect fields for json form widget", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.JSONFORM, 450, 200);

    entityExplorer.NavigateToSwitcher("Explorer");

    dataSources.CreateDataSource("Postgres");

    cy.get("@dsName").then((dsName) => {
      entityExplorer.NavigateToSwitcher("Widgets");

      entityExplorer.SelectEntityByName("JSONForm1", "Widgets");

      oneClickBinding.ChooseAndAssertForm(
        `${dsName}`,
        dsName,
        "public.employees",
      );
    });

    // Open the column selector modal
    agHelper.GetNClick(oneClickBindingLocator.columnSelectorModalTrigger);

    // Deselect some columns
    const deselectColumns = ["title_of_courtesy", "birth_date", "hire_date"];

    deselectColumns.forEach((column) => {
      agHelper.GetNClick(
        oneClickBindingLocator.columnSelectorField(column),
        0,
        true,
      );
    });

    // Save the column selection
    agHelper.GetNClick(oneClickBindingLocator.columnselectorModalSaveBtn);

    agHelper.GetNClick(oneClickBindingLocator.connectData);

    agHelper.Sleep(2000);

    const selectedColumns = ["employee_id", "last_name", "first_name", "title"];

    // Assert that the selected columns are present in the form
    selectedColumns.forEach((column) => {
      agHelper.AssertElementExist(`[data-rbd-draggable-id=${column}]`);
    });

    // Assert that the deselected columns are not present in the form
    deselectColumns.forEach((column) => {
      agHelper.AssertElementAbsence(`[data-rbd-draggable-id=${column}]`);
    });
  });
});

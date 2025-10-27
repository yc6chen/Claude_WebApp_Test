/**
 * Page Object Model for Add Recipe Modal
 *
 * Best Practice: Encapsulate modal interactions in a dedicated page object
 */
export class AddRecipeModalPage {
  // Selectors
  get modal() {
    return cy.get('[role="dialog"]');
  }

  get nameInput() {
    return cy.get('input[name="name"]');
  }

  get descriptionInput() {
    return cy.get('textarea[name="description"]');
  }

  get prepTimeInput() {
    return cy.get('input[name="prep_time"]');
  }

  get cookTimeInput() {
    return cy.get('input[name="cook_time"]');
  }

  get addButton() {
    return cy.contains('button', 'Add Recipe');
  }

  get cancelButton() {
    return cy.contains('button', 'Cancel');
  }

  // Actions
  fillName(name) {
    this.nameInput.clear().type(name);
    return this;
  }

  fillDescription(description) {
    this.descriptionInput.clear().type(description);
    return this;
  }

  fillPrepTime(prepTime) {
    this.prepTimeInput.clear().type(prepTime.toString());
    return this;
  }

  fillCookTime(cookTime) {
    this.cookTimeInput.clear().type(cookTime.toString());
    return this;
  }

  /**
   * Fill the entire form with recipe data
   * Best Practice: Provide high-level methods that combine multiple actions
   */
  fillForm(recipeData) {
    if (recipeData.name) {
      this.fillName(recipeData.name);
    }
    if (recipeData.description) {
      this.fillDescription(recipeData.description);
    }
    if (recipeData.prep_time) {
      this.fillPrepTime(recipeData.prep_time);
    }
    if (recipeData.cook_time) {
      this.fillCookTime(recipeData.cook_time);
    }
    return this;
  }

  submit() {
    this.addButton.click();
    // Wait for modal to close
    cy.get('[role="dialog"]').should('not.exist');
    return this;
  }

  cancel() {
    this.cancelButton.click();
    cy.get('[role="dialog"]').should('not.exist');
    return this;
  }

  // Assertions
  shouldBeVisible() {
    this.modal.should('be.visible');
    return this;
  }

  shouldNotBeVisible() {
    cy.get('[role="dialog"]').should('not.exist');
    return this;
  }

  shouldHaveName(name) {
    this.nameInput.should('have.value', name);
    return this;
  }

  shouldHaveDescription(description) {
    this.descriptionInput.should('have.value', description);
    return this;
  }

  addButtonShouldBeDisabled() {
    this.addButton.should('be.disabled');
    return this;
  }

  addButtonShouldBeEnabled() {
    this.addButton.should('not.be.disabled');
    return this;
  }
}

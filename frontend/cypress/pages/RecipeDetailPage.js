/**
 * Page Object Model for Recipe Detail
 *
 * Best Practice: Create focused page objects for each major UI component
 */
export class RecipeDetailPage {
  // Selectors
  get detailContainer() {
    return cy.get('h4').parent().parent();
  }

  get recipeName() {
    return cy.get('h4');
  }

  get recipeDescription() {
    return cy.contains('h6', 'Description').parent();
  }

  get recipeIngredients() {
    return cy.contains('h6', 'Ingredients').parent();
  }

  get deleteButton() {
    return cy.get('[aria-label="delete"]');
  }

  // Actions
  clickDelete() {
    this.deleteButton.click();
  }

  // Assertions
  shouldDisplayRecipe(recipe) {
    if (recipe.name) {
      this.recipeName.should('contain', recipe.name);
    }
    if (recipe.description) {
      this.recipeDescription.should('contain', recipe.description);
    }
    return this;
  }

  shouldNotBeVisible() {
    cy.contains('Select a recipe to view details').should('be.visible');
    return this;
  }

  shouldBeVisible() {
    this.recipeName.should('be.visible');
    return this;
  }

  shouldHaveName(name) {
    this.recipeName.should('contain', name);
    return this;
  }

  shouldHaveDescription(description) {
    this.recipeDescription.should('contain', description);
    return this;
  }

  deleteButtonShouldBeVisible() {
    this.deleteButton.should('be.visible');
    return this;
  }
}

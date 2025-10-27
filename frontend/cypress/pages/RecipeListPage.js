/**
 * Page Object Model for Recipe List
 *
 * Best Practice: Use Page Object Models to encapsulate page interactions
 * This provides better maintainability and reusability across tests
 */
export class RecipeListPage {
  // Selectors
  get recipeList() {
    return cy.get('.MuiList-root').first();
  }

  get recipeItems() {
    return cy.get('.MuiListItemButton-root');
  }

  get addButton() {
    return cy.get('[aria-label="add"]');
  }

  get appBar() {
    return cy.contains('My Recipe Book');
  }

  // Actions
  visit() {
    cy.visit('/');
    // Wait for the page to be ready
    this.appBar.should('be.visible');
  }

  selectRecipe(recipeName) {
    cy.contains('.MuiListItemButton-root', recipeName).click();
  }

  clickAddButton() {
    this.addButton.click();
  }

  getRecipeItem(index) {
    return cy.get(`[data-testid="recipe-item-${index}"]`);
  }

  // Assertions
  shouldDisplayRecipes(count) {
    if (count === 0) {
      this.recipeItems.should('not.exist');
    } else {
      this.recipeItems.should('have.length', count);
    }
    return this;
  }

  shouldContainRecipe(recipeName) {
    cy.contains(recipeName).should('be.visible');
    return this;
  }

  shouldNotContainRecipe(recipeName) {
    cy.contains(recipeName).should('not.exist');
    return this;
  }

  shouldBeVisible() {
    this.recipeList.should('be.visible');
    return this;
  }
}

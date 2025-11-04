# Feature Addition Checklist

Use this checklist when adding new features or tests to ensure all documentation is updated.

## 📝 Code Changes
- [ ] Feature implemented
- [ ] Tests written for new feature
- [ ] All tests passing
- [ ] Code reviewed

## 📚 Documentation Updates

### README.md
- [ ] Add feature to "Features" section
- [ ] Update "API Endpoints" if applicable
- [ ] Update "Project Structure" if files/folders added
- [ ] Update "Tech Stack" if new dependencies added
- [ ] Add link to new documentation if created (see below)

### TESTING.md
- [ ] Add testing guidelines for new feature
- [ ] Include examples of test patterns used
- [ ] Update test counts in "Overview" section
- [ ] Add edge cases and validation requirements
- [ ] Reference additional documentation if created

### TEST_QUICK_START.md
- [ ] Update test counts in "Expected Output" section
- [ ] Add new test commands if applicable
- [ ] Update "Test File Locations" if new test files added
- [ ] Update "Test Categories" table with new counts
- [ ] Add any new common issues to troubleshooting

### TESTING.md
- [ ] Update Quick Summary table with total test counts
- [ ] Update coverage percentages in Quick Summary
- [ ] Update Test File Locations section if new test files added
- [ ] Add examples for new test patterns if applicable
- [ ] Update "Last Updated" date

## 📄 Additional Documentation (If Needed)

Consider creating additional documentation if:
- [ ] Feature is complex and requires detailed explanation
- [ ] New testing patterns or frameworks introduced
- [ ] Architecture decisions need documentation
- [ ] Setup guides needed for specific components
- [ ] Extensive API documentation required
- [ ] Troubleshooting guide would be helpful

### If Creating New Documentation:
- [ ] Create new doc file in appropriate location (docs/, backend/, frontend/)
- [ ] Use the documentation template from DOCUMENTATION_MAINTENANCE.md
- [ ] Add reference in README.md "Available Documentation" section
- [ ] Add cross-references from related existing docs
- [ ] Include table of contents for longer documents
- [ ] Add "Last Updated" date at the bottom
- [ ] Update DOCUMENTATION_MAINTENANCE.md to list the new document
- [ ] Include clear examples and usage instructions

**New Documentation File Created** (if applicable):
- File name: ___________________________
- Location: ___________________________
- Purpose: ___________________________

## 🔍 Verification
- [ ] All cross-references between docs work
- [ ] Code examples in docs are accurate
- [ ] Test counts match actual tests
- [ ] No broken links
- [ ] Consistent formatting across all docs

## 📊 Test Metrics
Record your updates here:

**Tests Added**:
- Backend: ___ tests
- Frontend: ___ tests
- Total: ___ tests

**Coverage**:
- Backend: ___%
- Frontend: ___%

**Files Modified**:
- [ ] List test files created/modified
- [ ] List documentation files updated

## 💡 Notes
Add any special considerations or context here:

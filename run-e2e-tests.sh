#!/bin/bash

# Script to run Playwright E2E tests in Docker
# Usage: ./run-e2e-tests.sh [options]
#
# Options:
#   --build    Build the Playwright image before running tests
#   --headed   Run tests in headed mode (opens browser)
#   --ui       Run tests in UI mode
#   --debug    Run tests in debug mode
#   --report   Show test report after running

set -e

BUILD_FLAG=""
TEST_COMMAND="test"
SHOW_REPORT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --build)
      BUILD_FLAG="--build"
      shift
      ;;
    --headed)
      TEST_COMMAND="test:headed"
      shift
      ;;
    --ui)
      TEST_COMMAND="test:ui"
      shift
      ;;
    --debug)
      TEST_COMMAND="test:debug"
      shift
      ;;
    --report)
      SHOW_REPORT=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./run-e2e-tests.sh [--build] [--headed] [--ui] [--debug] [--report]"
      exit 1
      ;;
  esac
done

echo "🚀 Starting E2E Tests with Playwright..."
echo ""

# Check if main services are running
if ! docker-compose ps | grep -q "frontend.*Up"; then
  echo "⚠️  Frontend service is not running!"
  echo "Starting all services first..."
  docker-compose up -d
  echo "Waiting for services to be ready..."
  sleep 10
fi

echo "✅ Services are running"
echo ""

# Build and run Playwright tests
echo "🎭 Running Playwright tests..."
if [ -n "$BUILD_FLAG" ]; then
  echo "Building Playwright image..."
  docker-compose --profile e2e build playwright
fi

# Run the tests
docker-compose --profile e2e run --rm playwright npm run $TEST_COMMAND

TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ All E2E tests passed!"
else
  echo ""
  echo "❌ Some E2E tests failed. Exit code: $TEST_EXIT_CODE"
fi

# Show report if requested
if [ "$SHOW_REPORT" = true ]; then
  echo ""
  echo "📊 Opening test report..."
  docker-compose --profile e2e run --rm -p 9323:9323 playwright npm run report
fi

echo ""
echo "Test reports are available in: ./e2e/playwright-report/"
echo "Test results are available in: ./e2e/test-results/"

exit $TEST_EXIT_CODE

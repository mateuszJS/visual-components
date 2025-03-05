import { test, expect } from '@playwright/test';
import path from 'path';

test('visible image after upload', async ({ page }) => {
  await page.goto('http://127.0.0.1:3000');

    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '../image-sample.png');
    await fileInput.setInputFiles(testImagePath);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible()

    const afterUploadScreenshot = await canvas.screenshot()
  expect(afterUploadScreenshot).toMatchSnapshot('after-upload.png')
// npx playwright test --update-snapshots
  const moveImgBtn = page.locator('#img-position')
  await moveImgBtn.click()
  const afterMoveScreenshot = await canvas.screenshot()
  expect(afterMoveScreenshot).toMatchSnapshot('after-move.png')

});


/*
npx playwright test
    Runs the end-to-end tests.

  npx playwright test --ui
    Starts the interactive UI mode.

  npx playwright test --project=chromium
    Runs the tests only on Desktop Chrome.

  npx playwright test example
    Runs the tests in a specific file.

  npx playwright test --debug
    Runs the tests in debug mode.

  npx playwright codegen
    Auto generate tests with Codegen.

We suggest that you begin by typing:

    npx playwright test
*/
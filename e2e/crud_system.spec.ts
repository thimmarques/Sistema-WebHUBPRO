import { test, expect } from '@playwright/test';

test('CRUD Validation Test', async ({ page }) => {
  await page.goto('http://localhost:5173');
});

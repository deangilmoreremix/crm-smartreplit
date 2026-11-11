import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { USER_A, login, missingEnv, openFirstContact, uniq } from './helpers';

/** Flow 4: record page: tabs, rich note, attachment upload, timeline entry. */
test.describe('contact record page', () => {
  test.skip(!!missingEnv(), missingEnv());

  test('tabs, rich note, attachment and timeline', async ({ page }) => {
    await login(page, USER_A);
    const recordPath = await openFirstContact(page);

    await expect(page.getByRole('tablist', { name: 'Record sections' })).toBeVisible();
    for (const label of ['Overview', 'Timeline', 'Notes', 'Tasks', 'Files', 'Related']) {
      await expect(page.getByRole('tab', { name: label })).toBeVisible();
    }

    // rich note
    await page.getByRole('tab', { name: 'Notes' }).click();
    const text = uniq('e2e note');
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type(text);
    await page.getByRole('toolbar', { name: 'Formatting' }).getByRole('button').first().click(); // bold / first format button
    await page.getByRole('button', { name: 'Save note' }).click();
    await expect(page.getByText(text).first(), 'saved note appears in the list').toBeVisible();

    // note survives a reload
    await page.reload();
    await page.getByRole('tab', { name: 'Notes' }).click();
    await expect(page.getByText(text).first()).toBeVisible();

    // timeline shows the note event
    await page.getByRole('tab', { name: 'Timeline' }).click();
    await expect(page.getByRole('tabpanel')).toContainText(/note|created|updated/i, { timeout: 20_000 });

    // attachment
    await page.getByRole('tab', { name: 'Files' }).click();
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-')), 'e2e-attachment.txt');
    fs.writeFileSync(file, 'e2e attachment');
    await page.locator('input[type="file"]').setInputFiles(file);
    await expect(page.getByText('e2e-attachment.txt').first(), 'uploaded file is listed').toBeVisible({ timeout: 30_000 });

    expect(recordPath).toMatch(/^\/contacts\//);
  });
});

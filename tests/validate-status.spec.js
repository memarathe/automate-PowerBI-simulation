const { test, expect } = require('@playwright/test');

test.setTimeout(300_000);

test.describe('Power BI report smoke-flow with robust waits + hover before export', () => {
  test('replay manual clicks and export data', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'auth.json' });
    const page    = await context.newPage();

    // Navigate using baseURL from config
    await page.goto(
      'https://app.powerbi.com/groups/me/reports/' +
      '31e4e329-4105-4271-b1e7-910d144b6e43/' +
      'ReportSection76c409e0c333d60bb1e2?experience=power-bi',
      { waitUntil: 'networkidle' }
    );

  

    // // Helpers
    // async function clickWhenReady(locator, { timeout = 20_000, label = '' } = {}) {
    //   await locator.waitFor({ state: 'visible', timeout });
    //   await locator.click();
    //   if (label) console.log(`✔ clicked ${label}`);
    // }
    async function clickWhenReady(locator, { timeout = 20_000, label = '', postWaitLocator } = {}) {
    await locator.waitFor({ state: 'visible', timeout });
    await locator.click();
    if (label) console.log(`✔ clicked ${label}`);
    if (postWaitLocator) {
      await postWaitLocator.waitFor({ state: 'visible', timeout: 60_000 });
    }
  }
    async function hoverWhenReady(locator, { timeout = 10_000, label = '' } = {}) {
      await locator.waitFor({ state: 'visible', timeout });
      await locator.hover();
      if (label) console.log(`🖱 hovered ${label}`);
    }

    // Numeric slicers
    for (const name of [
      '0.7559714356069933',
      '0.7124463519313304',
      '0.6436621892851628',
      '0.5313628158844765'
    ]) {
      await clickWhenReady(page.getByRole('option', { name }), { label: `numeric ${name}` });
    }

    // ID slicers
    for (const name of ['4106300', '1572500']) {
      await clickWhenReady(page.getByRole('option', { name }), { label: `ID ${name}` });
    }

    // Labels
    const reportFrame = page.frameLocator('iframe'); // adjust selector if needed

    await clickWhenReady(
      reportFrame.getByText(/Influencer unselected As/i, { exact: false }),
      { 
        label: 'Influencer unselected As',
        timeout: 60_000 // give it more breathing room
      }
    );


    // await clickWhenReady(page.getByText('Influencer unselected As'), { label: 'Influencer unselected As', timeout: 30_000 });
    await clickWhenReady(page.getByText('Discount goes up'), { label: 'Discount goes up' });
    await clickWhenReady(page.getByText('Sales owner is Molly Clark'), { label: 'Sales owner is Molly Clark' });

    // Dropdown slicer with checkboxes
    const dropdown = page.getByTestId('slicer-dropdown');
    await clickWhenReady(dropdown, { label: 'open slicer dropdown' });
    await page.getByRole('checkbox', { name: 'Won' }).check({ timeout: 10_000 });
    await page.getByRole('checkbox', { name: 'Lost' }).check({ timeout: 10_000 });
    await clickWhenReady(dropdown, { label: 'close slicer dropdown' });

    // Top segments
    await clickWhenReady(page.getByRole('tab', { name: 'Top segments' }), { label: 'Top segments tab' });
    await clickWhenReady(page.getByTitle('63.9%'), { label: '63.9% visual' });
    await clickWhenReady(page.getByText('51.7%'), { label: '51.7% visual' });

    // Decomposition Tree navigation
    await clickWhenReady(
      page.getByRole('link', { name: 'Page navigation . Decomposition Tree View' }),
      { label: 'Decomposition Tree link', timeout: 15_000 }
    );

    // Wait for the decomposition tree visual container
    const decompTree = page.locator('[data-visual-type="decompositionTreeVisual"]');
    await decompTree.waitFor({ state: 'visible', timeout: 60_000 });

    // Click the node labelled 8468 inside the visual
    await clickWhenReady(decompTree.getByText('8468', { exact: true }), { label: '8468 node', timeout: 30_000 });

    // Hover the visual to reveal the more-options menu
    await hoverWhenReady(decompTree, { label: 'decomposition tree visual' });

    // Export flow
    await clickWhenReady(page.getByTestId('visual-more-options-btn'), { label: 'more options menu' });
    await clickWhenReady(page.getByTestId('pbimenu-item.Export data'), { label: 'Export data menu item' });
    await clickWhenReady(page.getByText('Export the summarized data'), { label: 'summarized data' });

    // Trigger and verify download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      clickWhenReady(page.getByTestId('export-btn'), { label: 'Export button' })
    ]);
    expect(download).toBeTruthy();

    await context.close();
  });
});
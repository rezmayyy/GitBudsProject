// Set an extended timeout to accommodate live data delays.
jest.setTimeout(60000);

describe('Full Ticket Workflow E2E Test', () => {
    it('logs in, views an existing ticket, navigates pages, and creates a new ticket', async () => {
        // ***** Step 1: Log In *****
        await page.goto('http://localhost:3000/login');
        await page.waitForSelector('input[placeholder="Email"]');
        await page.waitForSelector('input[placeholder="Password"]');

        // Fill in login details
        await page.type('input[placeholder="Email"]', 'gitbuds@gmail.com');
        await page.type('input[placeholder="Password"]', 'Tester1!');
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log('Logged in successfully.');

        // ***** Step 2: Navigate to the Ticket Page *****
        await page.goto('http://localhost:3000/ticket');
        // Ticket.jsx renders a container with the CSS class "ticketContainer"
        await page.waitForSelector('.ticketContainer', { timeout: 20000 });
        console.log('Ticket page loaded.');

        // ***** Step 3: Click an Existing Ticket (if available) *****
        // Assume that each ticket is rendered by TicketItem and outputs an element with a class "ticketItem".
        // If not, you can change the selector to target a clickable element within the ticket list (e.g. the first child of the .category container).
        const ticketSelector = '.ticketItem';
        const existingTicket = await page.$(ticketSelector);
        if (existingTicket) {
            console.log('Existing ticket found. Clicking to view details.');
            await existingTicket.click();
            // Assume that clicking a ticket loads a detail view with a container having a class like "ticketDetail".
            // Adjust this selector if your detail view renders differently.
            await page.waitForSelector('.ticketDetail', { timeout: 20000 });
            console.log('Ticket detail view loaded.');

            // Return to the ticket list view (simulate a "back" action)
            await page.goBack({ waitUntil: 'networkidle0' });
            await page.waitForSelector('.ticketContainer', { timeout: 20000 });
        } else {
            console.log('No existing ticket found to view.');
        }

        // ***** Step 4: Use Pagination - Click "Next" *****
        // The pagination buttons are inside a container with the CSS class "pagination".
        // Using XPath to find the button with the text "Next".
        const [nextButton] = await page.$x("//div[contains(@class, 'pagination')]//button[contains(., 'Next')]");
        if (nextButton) {
            await nextButton.click();
            await page.waitForTimeout(2000);
            console.log('Navigated to the next page.');
        } else {
            console.log('Next page button not found.');
        }

        // ***** Step 5: Create a New Ticket *****
        // Click the "+ New Ticket" button. (CSS class: newTicketButton)
        await page.waitForSelector('button.newTicketButton', { timeout: 20000 });
        await page.click('button.newTicketButton');
        console.log('New Ticket button clicked.');

        // Wait for the CreateTicket form to load; it contains an input with placeholder "Ticket Title"
        await page.waitForSelector('input[placeholder="Ticket Title"]', { timeout: 20000 });

        // Fill in the new ticket form.
        const testTicketTitle = "E2E Test Ticket";
        const testTicketDescription = "This ticket was created during an end-to-end test.";
        await page.type('input[placeholder="Ticket Title"]', testTicketTitle);
        await page.type('textarea[placeholder="Description"]', testTicketDescription);
        await page.click('button[type="submit"]');
        console.log('Submitted new ticket form.');

        // Wait for the new ticket to be added to the ticket list.
        await page.waitForFunction(
            title => {
                const items = Array.from(document.querySelectorAll('.ticketItem'));
                return items.some(item => item.textContent.includes(title));
            },
            { timeout: 30000 },
            testTicketTitle
        );

        // Confirm and log the existence of the new ticket.
        const newTicketExists = await page.evaluate(title => {
            const items = Array.from(document.querySelectorAll('.ticketItem'));
            return items.some(item => item.textContent.includes(title));
        }, testTicketTitle);

        console.log(newTicketExists ? 'New ticket created and visible in the list.' : 'New ticket not found.');
        expect(newTicketExists).toBeTruthy();
    });
});

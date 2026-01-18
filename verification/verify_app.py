from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock electronAPI
        page.add_init_script("""
            window.electronAPI = {
                makeRequest: async (data) => {
                    console.log('Mock request', data);
                    return {
                        status: 200,
                        statusText: 'OK',
                        data: { message: 'Hello from verification', input: data },
                        headers: { 'content-type': 'application/json' }
                    };
                }
            };
        """)

        # Navigate to the local dev server
        # Note: Ensure 'npm run dev' or 'npm run dev:renderer' is running
        page.goto("http://localhost:5173")

        # Check for main UI elements
        page.wait_for_selector('text=History')
        page.wait_for_selector('text=Send')

        # Type in URL
        page.fill('input[placeholder="Enter request URL"]', 'https://jsonplaceholder.typicode.com/posts/1')

        # Click Send
        page.click('button:has-text("Send")')

        # Wait for status update
        page.wait_for_selector('text=200 OK')

        # Check if response is displayed
        # Since response body is in a textarea, we verify its value
        body_content = page.locator('textarea').first.input_value()

        if "Hello from verification" in body_content:
            print("Verification Successful: Response body matches")
        else:
            print(f"Verification Failed: {body_content}")
            raise Exception("Response body verification failed")

        # Take screenshot
        page.screenshot(path="verification/app_screenshot.png")

        browser.close()

if __name__ == "__main__":
    verify_app()

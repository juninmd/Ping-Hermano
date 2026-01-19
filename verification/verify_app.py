import os
import time
from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        # We need to launch the electron app.
        # However, Playwright for Python usually connects to a web server or launches a browser.
        # Launching Electron with Playwright is possible but requires the 'electron' executable path.
        # Since this is a restricted environment, we might not have 'electron' binary easily accessible via Playwright's launch_persistent_context or similar.
        # BUT, the instructions say "Start the local development server".
        # For an Electron app, the renderer is served by Vite on localhost:5173 (based on package.json).
        # So we can test the RENDERER in a standard browser (headless chromium) by mocking the electronAPI.

        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock window.electronAPI
        page.add_init_script("""
            window.electronAPI = {
                makeRequest: async (data) => {
                    console.log('Mock request:', data);
                    return {
                        status: 200,
                        statusText: 'OK',
                        headers: { 'content-type': 'application/json' },
                        data: { message: 'Hello from mock!', input: data }
                    };
                }
            };
        """)

        # Navigate to the vite dev server (we assume it's running)
        try:
            page.goto("http://localhost:5173")
        except Exception as e:
            print(f"Failed to load page: {e}")
            return

        # Wait for app to load
        page.wait_for_selector('text=History')

        # 1. Verify Auth Tab exists
        page.click('text=Auth')
        page.wait_for_selector('text=Type:')
        print("Auth tab verified.")

        # 2. Verify Preview Tab exists (initially hidden or in ResponseViewer?)
        # ResponseViewer tabs (Body, Preview, Headers) show up when there is a response?
        # Let's check the code: ResponseViewer returns "Enter URL..." if no response.
        # So we need to make a request first.

        page.fill('input[placeholder="Enter request URL"]', 'http://example.com')
        page.click('text=Send')

        # Wait for response
        page.wait_for_selector('text=Status:')

        # Now verify Preview tab
        page.click('text=Preview')
        # Check if iframe is present
        iframe = page.locator('iframe')
        if iframe.count() > 0:
            print("Preview tab verified.")
        else:
            print("Preview tab iframe not found.")

        # Take screenshot
        os.makedirs("verification_screenshots", exist_ok=True)
        page.screenshot(path="verification_screenshots/app_verification.png")
        print("Screenshot saved to verification_screenshots/app_verification.png")

        browser.close()

if __name__ == "__main__":
    verify_app()

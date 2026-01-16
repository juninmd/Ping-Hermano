from playwright.sync_api import sync_playwright
import time

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
                        data: { message: 'Mock response' },
                        headers: { 'content-type': 'application/json' }
                    };
                }
            };
        """)

        page.goto("http://localhost:5173")

        # Wait for elements to appear
        page.wait_for_selector('text=History')
        page.wait_for_selector('text=Send')

        # Take screenshot
        page.screenshot(path="verification/app_screenshot.png")

        browser.close()

if __name__ == "__main__":
    verify_app()

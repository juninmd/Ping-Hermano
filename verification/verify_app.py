from playwright.sync_api import sync_playwright

def verify_app_launch():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the local dev server
            page.goto("http://localhost:5173")

            # Wait for any content to load. Since 'PingHermano' text might be in title or component not immediately visible as text.
            # Let's wait for the sidebar or main layout.
            # Inspecting App.tsx or Sidebar.tsx would help, but generally waiting for #root to have children is a good start.
            page.wait_for_selector('#root > div', timeout=10000)

            # Take a screenshot
            page.screenshot(path="verification/app_screenshot.png")
            print("Screenshot taken successfully.")
        except Exception as e:
            print(f"Error taking screenshot: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app_launch()

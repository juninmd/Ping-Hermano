from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_body_type(page: Page):
    print("Navigating to app...")
    page.goto("http://localhost:5173")

    # Wait for app to load
    print("Waiting for sidebar...")
    expect(page.get_by_role("button", name="History")).to_be_visible()

    # Click Body tab
    print("Clicking Body tab...")
    page.get_by_text("Body").click()

    # Verify selector
    print("Verifying selectors...")
    expect(page.get_by_label("Raw (Text)")).to_be_visible()
    expect(page.get_by_label("JSON")).to_be_visible()

    # Click JSON
    print("Clicking JSON...")
    page.get_by_label("JSON").click()

    # Take screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/body_type_json.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_body_type(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error_body_type.png")
        finally:
            browser.close()

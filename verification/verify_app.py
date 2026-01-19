
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_app(page: Page):
    # 1. Arrange: Go to the app
    # Assuming the app is served at http://localhost:5173 by vite
    page.goto("http://localhost:5173")

    # Wait for the app to load
    # Use get_by_placeholder because that is robust in this app
    url_input = page.get_by_placeholder("Enter request URL")
    expect(url_input).to_be_visible(timeout=10000)

    # 2. Act: Interact with the app

    # Take initial screenshot
    page.screenshot(path="/home/jules/verification/01_initial_state.png")

    # Fill URL
    url_input.fill("https://jsonplaceholder.typicode.com/todos/1")

    # 3. Assert: Check URL in input
    expect(url_input).to_have_value("https://jsonplaceholder.typicode.com/todos/1")
    page.screenshot(path="/home/jules/verification/02_url_filled.png")

    # 4. Interact with Params
    # There should be empty key/value inputs by default
    key_inputs = page.get_by_placeholder("Key")
    value_inputs = page.get_by_placeholder("Value")

    # Add a param
    key_inputs.first.fill("foo")
    value_inputs.first.fill("bar")

    # Check if URL updated (Integration check)
    expect(url_input).to_have_value("https://jsonplaceholder.typicode.com/todos/1?foo=bar")
    page.screenshot(path="/home/jules/verification/03_params_added.png")

    # 5. Switch to Auth Tab
    page.get_by_text("Auth", exact=True).click()
    page.screenshot(path="/home/jules/verification/04_auth_tab.png")

    # 6. Switch to Body Tab
    page.get_by_text("Body", exact=True).click()
    page.screenshot(path="/home/jules/verification/05_body_tab.png")

    # 7. Final screenshot of everything
    page.screenshot(path="/home/jules/verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_app(page)
            print("Verification script finished successfully.")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()

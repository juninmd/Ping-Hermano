from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Handle dialogs
    def handle_dialog(dialog):
        print(f"Dialog opened: {dialog.message}")
        if "Enter environment name" in dialog.message:
            dialog.accept("Test Env")
        else:
            dialog.dismiss()

    page.on("dialog", handle_dialog)

    print("Navigating to app...")
    try:
        page.goto("http://localhost:5173", timeout=60000)
    except Exception as e:
        print(f"Navigation failed: {e}")
        browser.close()
        return

    print("Clicking Envs tab...")
    page.get_by_text("Envs").click()

    print("Clicking New Environment...")
    # The button has title "New Environment"
    page.get_by_title("New Environment").click()

    print("Waiting for Test Env...")
    # Wait for env to appear
    page.get_by_text("Test Env").wait_for()

    print("Clicking Edit...")
    # Click Edit (✏️)
    # Edit button appears on the item container.
    # We might need to hover or just find it.
    # It has title "Edit".
    page.get_by_title("Edit").click()

    print("Waiting for modal...")
    # Wait for modal
    page.get_by_text("Edit Environment").wait_for()

    # Verify inputs are present (logic check)
    count = page.get_by_placeholder("Variable").count()
    print(f"Variable rows: {count}")

    print("Taking screenshot...")
    page.screenshot(path="verification_screenshots/env_modal.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)

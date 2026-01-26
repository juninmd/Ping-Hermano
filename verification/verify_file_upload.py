from playwright.sync_api import sync_playwright
import time
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:5173")

        # Click Body tab
        page.get_by_text("Body").click()

        # Click Form Data
        page.get_by_label("Form Data").click()

        # Find the Select for Type (Text/File)
        # It's in the first row.
        # We can find it by value="text" initially.
        select = page.locator("select").filter(has_text="Text").first
        select.select_option("file")

        # Verify File input appears
        file_input = page.locator("input[type='file']")
        if file_input.count() > 0:
            print("File input found!")
        else:
            print("File input NOT found!")

        time.sleep(1) # Wait for render

        os.makedirs("verification_screenshots", exist_ok=True)
        page.screenshot(path="verification_screenshots/file_upload_ui.png")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

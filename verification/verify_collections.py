from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the app (assuming it runs on 5173 for renderer dev)
            # Since this is Electron, normally we'd launch the app, but for renderer changes
            # we can often test against the vite server directly if it's just UI.
            # However, Electron APIs won't work.
            # But here we just want to verify the sidebar UI and Collections tab.

            page.goto("http://localhost:5173")

            # Wait for Sidebar to load
            page.wait_for_selector('h3', state="visible")

            # Check for History and Collections tabs
            expect(page.get_by_role("button", name="History")).to_be_visible()
            collections_tab = page.get_by_role("button", name="Collections")
            expect(collections_tab).to_be_visible()

            # Click Collections tab
            collections_tab.click()

            # Check for "New Collection" button (➕) or similar
            expect(page.get_by_text("Saved")).to_be_visible()
            # expect(page.get_by_title("New Collection")).to_be_visible() # Title might not be accessible by text

            # Check for Save button in Request Editor
            expect(page.get_by_role("button", name="Save")).to_be_visible()

            # Take screenshot
            page.screenshot(path="verification/collections_ui.png")
            print("Screenshot taken at verification/collections_ui.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()

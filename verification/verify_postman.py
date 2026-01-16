from playwright.sync_api import sync_playwright

def verify_postman(page):
    page.goto("http://localhost:5173")

    # Wait for app to load
    page.wait_for_selector(".app-container")

    # Check Sidebar
    assert page.is_visible(".sidebar")
    assert page.is_visible("text=History")

    # Check Request Editor
    assert page.is_visible(".request-editor")
    assert page.is_visible("input[placeholder='Enter request URL']")

    # Type in URL
    page.fill("input[placeholder='Enter request URL']", "https://jsonplaceholder.typicode.com/todos/1")

    # Check Tabs
    page.click("text=Headers")
    assert page.is_visible("text=Key")
    assert page.is_visible("text=Value")

    page.click("text=Body")
    assert page.is_visible("textarea[placeholder='Request Body (JSON, XML, Text...)']")

    # Check Response Viewer (Empty state)
    assert page.is_visible("text=Enter URL and click Send")

    # Take screenshot
    page.screenshot(path="verification/postman_ui.png")
    print("Verification successful")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_postman(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
